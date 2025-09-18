# Product Requirements Document: RAG Subsystem
## Intelligent Matching Engine for BOIM

**Version:** 1.0  
**Parent PRD:** BOIM Master PRD  
**Component:** RAG Database & Matching Engine  
**Status:** Draft

---

## 1. Subsystem Overview

### 1.1 Purpose
The RAG (Retrieval-Augmented Generation) Subsystem serves as the intelligence layer that matches organizational profiles against a comprehensive database of 500+ benefit programs, tax incentives, and grants. It provides semantic understanding of complex eligibility requirements and generates context-aware recommendations.

### 1.2 Core Capabilities
- Multi-modal document ingestion (PDF, HTML, API, structured data)
- Semantic search across heterogeneous eligibility criteria
- Real-time eligibility validation with explanation generation
- Continuous learning from application outcomes
- Automated knowledge graph construction

---

## 2. Technical Architecture

### 2.1 RAG Pipeline Architecture

```python
class RAGPipeline:
    """
    Core RAG pipeline for benefit program matching
    """
    
    def __init__(self):
        self.document_processor = DocumentProcessor()
        self.embedding_engine = EmbeddingEngine()
        self.vector_store = VectorStore()
        self.retrieval_engine = RetrievalEngine()
        self.generation_engine = GenerationEngine()
        self.validation_engine = ValidationEngine()
    
    def process_pipeline(self, query_context):
        # Step 1: Query Understanding
        parsed_query = self.parse_organizational_context(query_context)
        
        # Step 2: Multi-Vector Retrieval
        candidates = self.retrieval_engine.retrieve(
            organization_vector=parsed_query.org_embedding,
            industry_vector=parsed_query.industry_embedding,
            location_vector=parsed_query.location_embedding,
            size_vector=parsed_query.size_embedding,
            k=100
        )
        
        # Step 3: Reranking with Business Logic
        reranked = self.apply_business_rules(candidates, parsed_query)
        
        # Step 4: Eligibility Validation
        validated = self.validation_engine.validate_eligibility(
            reranked, 
            parsed_query.organization_profile
        )
        
        # Step 5: Explanation Generation
        explanations = self.generation_engine.generate_explanations(
            validated,
            parsed_query.organization_profile
        )
        
        return MatchingResults(
            programs=validated,
            explanations=explanations,
            confidence_scores=self.calculate_confidence(validated)
        )
```

### 2.2 Document Ingestion System

#### 2.2.1 Source Connectors
```yaml
data_sources:
  federal:
    - source: "irs.gov"
      type: "web_scraper"
      frequency: "daily"
      endpoints:
        - "/tax-credits-deductions"
        - "/forms-instructions"
      parser: "IRS_TaxCreditParser"
    
    - source: "grants.gov"
      type: "api"
      frequency: "hourly"
      api_endpoint: "https://api.grants.gov/v2/opportunities"
      rate_limit: 1000/hour
      parser: "GrantsGovParser"
    
    - source: "sba.gov"
      type: "rss_feed"
      frequency: "real_time"
      feeds:
        - "/funding-programs/feed.xml"
      parser: "SBA_ProgramParser"
  
  state:
    - source: "illinois.gov/dceo"
      type: "pdf_monitor"
      frequency: "weekly"
      directories:
        - "/business-incentives"
        - "/workforce-programs"
      parser: "Illinois_IncentiveParser"
  
  carriers:
    - source: "internal_carrier_database"
      type: "database"
      connection: "carrier_llm_db"
      tables:
        - "wellness_programs"
        - "premium_discounts"
        - "value_added_services"
      parser: "CarrierProgramParser"
```

#### 2.2.2 Document Processing Pipeline
```python
class DocumentProcessor:
    def process_document(self, document):
        # Step 1: Format Detection
        doc_type = self.detect_format(document)
        
        # Step 2: Content Extraction
        if doc_type == 'pdf':
            content = self.extract_pdf_content(document)
        elif doc_type == 'html':
            content = self.extract_html_content(document)
        elif doc_type == 'structured':
            content = self.parse_structured_data(document)
        
        # Step 3: Metadata Extraction
        metadata = self.extract_metadata(content)
        
        # Step 4: Chunking Strategy
        chunks = self.intelligent_chunking(content, metadata)
        
        # Step 5: Entity Recognition
        entities = self.extract_entities(chunks)
        
        return ProcessedDocument(
            content=content,
            chunks=chunks,
            metadata=metadata,
            entities=entities
        )
    
    def intelligent_chunking(self, content, metadata):
        """
        Context-aware chunking that preserves eligibility requirements
        """
        chunks = []
        
        if metadata.document_type == 'tax_credit':
            # Keep eligibility criteria together
            chunks = self.chunk_by_sections(content, [
                'eligibility_requirements',
                'benefit_calculation',
                'application_process',
                'deadlines'
            ])
        elif metadata.document_type == 'grant_program':
            # Preserve grant structure
            chunks = self.chunk_by_grant_components(content)
        
        # Add overlap for context preservation
        return self.add_chunk_overlap(chunks, overlap_tokens=50)
```

### 2.3 Embedding Generation

#### 2.3.1 Multi-Model Embedding Strategy
```python
class EmbeddingEngine:
    def __init__(self):
        self.models = {
            'general': OpenAIEmbedding(model='text-embedding-3-large'),
            'financial': FinancialBERT(),
            'legal': LegalBERT(),
            'geographic': GeoEncoder()
        }
    
    def generate_embeddings(self, text, context_type):
        """
        Generate multiple embeddings for different search contexts
        """
        embeddings = {}
        
        # General semantic embedding
        embeddings['semantic'] = self.models['general'].encode(text)
        
        # Domain-specific embeddings
        if 'tax' in context_type or 'financial' in context_type:
            embeddings['financial'] = self.models['financial'].encode(text)
        
        if 'regulation' in context_type or 'compliance' in context_type:
            embeddings['legal'] = self.models['legal'].encode(text)
        
        if 'location' in context_type:
            embeddings['geographic'] = self.models['geographic'].encode(text)
        
        # Combine embeddings with weights
        combined = self.weighted_combination(embeddings, context_type)
        
        return combined
```

#### 2.3.2 Organization Profile Embedding
```python
def embed_organization_profile(org_profile):
    """
    Create comprehensive embedding of organization for matching
    """
    profile_text = f"""
    Industry: {org_profile.industry} {org_profile.naics_code}
    Size: {org_profile.employee_count} employees
    Revenue: ${org_profile.annual_revenue}
    Location: {org_profile.city}, {org_profile.state}
    Structure: {org_profile.entity_type}
    Certifications: {', '.join(org_profile.certifications)}
    Current Benefits: {', '.join(org_profile.benefit_offerings)}
    Goals: {org_profile.optimization_goals}
    """
    
    # Generate base embedding
    base_embedding = generate_embedding(profile_text)
    
    # Add structured features
    structured_features = encode_structured_features({
        'employee_count': org_profile.employee_count,
        'revenue_bracket': get_revenue_bracket(org_profile.annual_revenue),
        'industry_category': map_industry_category(org_profile.naics_code),
        'geographic_region': get_region(org_profile.state)
    })
    
    # Concatenate embeddings
    return np.concatenate([base_embedding, structured_features])
```

### 2.4 Vector Database Design

#### 2.4.1 Index Structure
```yaml
vector_indexes:
  programs:
    dimensions: 1536
    metric: cosine
    index_type: HNSW
    ef_construction: 200
    M: 16
    
  eligibility_rules:
    dimensions: 768
    metric: euclidean
    index_type: IVF
    nlist: 1000
    nprobe: 10
    
  success_stories:
    dimensions: 1536
    metric: cosine
    index_type: Flat
    
metadata_indexes:
  - field: "state"
    type: "keyword"
  - field: "industry_codes"
    type: "keyword[]"
  - field: "employee_range"
    type: "range"
  - field: "deadline"
    type: "date"
  - field: "benefit_type"
    type: "keyword"
```

#### 2.4.2 Hybrid Search Implementation
```python
class HybridSearchEngine:
    def search(self, query, filters):
        # Step 1: Vector similarity search
        vector_results = self.vector_search(
            query_embedding=query.embedding,
            top_k=100,
            index='programs'
        )
        
        # Step 2: Keyword/filter search
        filter_results = self.filter_search(
            filters={
                'state': query.state,
                'employee_range': query.employee_count,
                'industry_codes': query.naics_codes
            }
        )
        
        # Step 3: Graph traversal for related programs
        graph_results = self.graph_search(
            start_nodes=vector_results[:10],
            relationship_types=['prerequisite', 'stackable', 'alternative'],
            max_depth=2
        )
        
        # Step 4: Combine and rerank
        combined = self.reciprocal_rank_fusion([
            vector_results,
            filter_results,
            graph_results
        ])
        
        return combined
```

### 2.5 Knowledge Graph Integration

#### 2.5.1 Graph Schema
```cypher
// Node Types
CREATE (p:Program {
    id: STRING,
    name: STRING,
    type: STRING,
    agency: STRING,
    max_benefit: FLOAT,
    deadline_type: STRING
})

CREATE (r:Requirement {
    id: STRING,
    type: STRING,
    description: STRING,
    is_mandatory: BOOLEAN
})

CREATE (i:Industry {
    naics_code: STRING,
    name: STRING,
    category: STRING
})

CREATE (l:Location {
    type: STRING, // city, county, state, federal
    name: STRING,
    fips_code: STRING
})

// Relationships
CREATE (p)-[:REQUIRES]->(r)
CREATE (p)-[:AVAILABLE_IN]->(l)
CREATE (p)-[:APPLIES_TO]->(i)
CREATE (p1)-[:STACKABLE_WITH]->(p2)
CREATE (p1)-[:MUTUALLY_EXCLUSIVE]->(p2)
CREATE (p1)-[:PREREQUISITE_FOR]->(p2)
```

#### 2.5.2 Graph Traversal Queries
```python
def find_program_stack(organization, initial_programs):
    """
    Find optimal combination of stackable programs
    """
    query = """
    MATCH (p1:Program)
    WHERE p1.id IN $initial_programs
    MATCH path = (p1)-[:STACKABLE_WITH*1..3]-(p2:Program)
    WHERE ALL(
        req IN [(p2)-[:REQUIRES]->(r:Requirement) | r] 
        WHERE req.is_mandatory = false 
        OR evaluate_requirement(req, $org_profile)
    )
    WITH p1, collect(distinct p2) as stackable
    RETURN p1.id as base_program, 
           [s IN stackable | {
               id: s.id, 
               name: s.name,
               benefit: s.max_benefit,
               compatibility: calculate_compatibility(p1, s)
           }] as compatible_programs
    ORDER BY sum([s IN stackable | s.max_benefit]) DESC
    """
    
    return graph.query(query, {
        'initial_programs': initial_programs,
        'org_profile': organization.to_dict()
    })
```

### 2.6 Continuous Learning System

#### 2.6.1 Feedback Loop Architecture
```python
class FeedbackLearner:
    def __init__(self):
        self.success_tracker = SuccessTracker()
        self.embedding_adjuster = EmbeddingAdjuster()
        self.weight_optimizer = WeightOptimizer()
    
    def process_outcome(self, application_outcome):
        """
        Learn from application success/failure
        """
        # Record outcome
        self.success_tracker.record(
            program_id=application_outcome.program_id,
            organization_profile=application_outcome.org_profile,
            result=application_outcome.result,
            rejection_reason=application_outcome.rejection_reason
        )
        
        # Adjust embeddings if needed
        if application_outcome.result == 'rejected':
            self.embedding_adjuster.adjust_negative(
                program_embedding=get_program_embedding(application_outcome.program_id),
                org_embedding=get_org_embedding(application_outcome.org_profile),
                reason=application_outcome.rejection_reason
            )
        
        # Update matching weights
        self.weight_optimizer.update_weights(
            feature_importance=self.calculate_feature_importance(
                application_outcome
            )
        )
        
        # Retrain reranker if threshold met
        if self.success_tracker.needs_retraining():
            self.retrain_reranker()
```

#### 2.6.2 Active Learning Pipeline
```python
class ActiveLearningPipeline:
    def identify_uncertain_matches(self, matches):
        """
        Identify matches requiring human validation
        """
        uncertain = []
        
        for match in matches:
            # Low confidence score
            if match.confidence < 0.7:
                uncertain.append(match)
            
            # Conflicting signals
            elif match.vector_score > 0.9 and match.rule_score < 0.5:
                uncertain.append(match)
            
            # New program without history
            elif self.get_application_history(match.program_id).count == 0:
                uncertain.append(match)
        
        return uncertain
    
    def request_expert_review(self, uncertain_matches):
        """
        Queue matches for expert review
        """
        for match in uncertain_matches:
            self.review_queue.add({
                'match': match,
                'priority': self.calculate_review_priority(match),
                'deadline': match.program.deadline,
                'potential_value': match.estimated_benefit
            })
```

---

## 3. Data Management

### 3.1 Data Quality Assurance

#### 3.1.1 Validation Rules
```yaml
validation_rules:
  program_data:
    - field: "max_benefit"
      rules:
        - type: "range"
          min: 0
          max: 100000000
        - type: "format"
          pattern: "^\\d+(\\.\\d{2})?$"
    
    - field: "eligibility_requirements"
      rules:
        - type: "completeness"
          required_fields: ["entity_type", "location", "size"]
        - type: "consistency"
          check: "employee_min <= employee_max"
    
    - field: "deadline"
      rules:
        - type: "temporal"
          constraint: "future_date or recurring"
        - type: "format"
          pattern: "ISO8601 or CRON"
```

#### 3.1.2 Data Freshness Monitoring
```python
class FreshnessMonitor:
    def check_data_freshness(self):
        alerts = []
        
        for source in self.data_sources:
            last_update = self.get_last_update(source)
            expected_frequency = source.update_frequency
            
            if self.is_stale(last_update, expected_frequency):
                alerts.append({
                    'source': source.name,
                    'last_update': last_update,
                    'expected': expected_frequency,
                    'severity': self.calculate_severity(source)
                })
        
        return alerts
```

### 3.2 Performance Optimization

#### 3.2.1 Caching Strategy
```python
class CacheManager:
    def __init__(self):
        self.embedding_cache = RedisCache(ttl=86400)  # 24 hours
        self.result_cache = RedisCache(ttl=3600)      # 1 hour
        self.profile_cache = MemoryCache(max_size=1000)
    
    def get_cached_embedding(self, text_hash):
        return self.embedding_cache.get(text_hash)
    
    def cache_search_results(self, query_hash, results):
        # Cache with smart invalidation
        self.result_cache.set(
            key=query_hash,
            value=results,
            tags=['search', results.org_id, results.timestamp]
        )
    
    def invalidate_by_program(self, program_id):
        # Invalidate all cached results containing this program
        self.result_cache.delete_by_tag(f"program:{program_id}")
```

#### 3.2.2 Query Optimization
```python
def optimize_vector_query(query, context):
    """
    Optimize vector search based on context
    """
    # Adjust search parameters based on context
    if context.is_time_sensitive:
        # Prioritize speed over accuracy
        search_params = {
            'ef_search': 100,  # Lower for speed
            'top_k': 50,        # Fewer candidates
            'rerank': False     # Skip reranking
        }
    elif context.is_high_value:
        # Prioritize accuracy
        search_params = {
            'ef_search': 500,   # Higher for accuracy
            'top_k': 200,        # More candidates
            'rerank': True,      # Include reranking
            'cross_validate': True
        }
    else:
        # Balanced approach
        search_params = {
            'ef_search': 200,
            'top_k': 100,
            'rerank': True
        }
    
    return search_params
```

---

## 4. Integration Specifications

### 4.1 CarrierLLM Integration

#### 4.1.1 Data Exchange Protocol
```python
class CarrierLLMConnector:
    def sync_organization_data(self, org_id):
        """
        Bidirectional sync with CarrierLLM
        """
        # Pull insurance qualification data
        insurance_data = self.carrier_llm_api.get_organization(org_id)
        
        # Extract relevant fields for BOIM
        boim_profile = {
            'industry': insurance_data.industry_classification,
            'employees': insurance_data.employee_count,
            'revenue': insurance_data.annual_revenue,
            'current_carriers': insurance_data.carriers,
            'risk_profile': insurance_data.risk_score,
            'claims_history': insurance_data.claims_summary
        }
        
        # Push back optimization opportunities
        self.carrier_llm_api.update_organization(
            org_id,
            {
                'benefit_optimization_score': boim_score,
                'identified_savings': total_savings,
                'recommended_programs': program_list
            }
        )
        
        return boim_profile
```

#### 4.1.2 Event Streaming
```yaml
event_streams:
  from_carrier_llm:
    - event: "organization.created"
      handler: "create_boim_profile"
    - event: "organization.updated"
      handler: "update_boim_profile"
    - event: "quote.generated"
      handler: "trigger_optimization_search"
  
  to_carrier_llm:
    - event: "opportunity.identified"
      payload: ["program_id", "estimated_savings", "requirements"]
    - event: "application.submitted"
      payload: ["program_id", "status", "expected_outcome"]
    - event: "benefit.realized"
      payload: ["program_id", "actual_savings", "implementation_date"]
```

### 4.2 External API Integration

#### 4.2.1 API Adapters
```python
class GrantsGovAdapter:
    def __init__(self):
        self.base_url = "https://api.grants.gov/v2"
        self.auth_token = self.get_auth_token()
        self.rate_limiter = RateLimiter(calls=1000, period=3600)
    
    def search_opportunities(self, criteria):
        endpoint = f"{self.base_url}/opportunities/search"
        
        params = {
            'naics_codes': criteria.naics_codes,
            'funding_instruments': ['grant', 'cooperative_agreement'],
            'eligibility': self.map_eligibility(criteria),
            'status': 'posted'
        }
        
        with self.rate_limiter:
            response = requests.get(
                endpoint,
                params=params,
                headers={'Authorization': f'Bearer {self.auth_token}'}
            )
        
        return self.parse_opportunities(response.json())
```

---

## 5. Security & Compliance

### 5.1 Data Privacy
```python
class PrivacyManager:
    def anonymize_for_embedding(self, org_data):
        """
        Remove PII before embedding generation
        """
        anonymized = org_data.copy()
        
        # Hash identifiers
        anonymized['org_id'] = self.hash_id(org_data['org_id'])
        anonymized['ein'] = self.hash_id(org_data['ein'])
        
        # Generalize sensitive data
        anonymized['revenue'] = self.to_range(org_data['revenue'])
        anonymized['employees'] = self.to_range(org_data['employees'])
        
        # Remove direct identifiers
        del anonymized['company_name']
        del anonymized['address']
        
        return anonymized
```

### 5.2 Audit Logging
```yaml
audit_events:
  - event: "program_match"
    data: ["org_id", "program_id", "confidence_score", "timestamp"]
    retention: "7_years"
  
  - event: "eligibility_check"
    data: ["org_id", "program_id", "result", "reason", "timestamp"]
    retention: "7_years"
  
  - event: "application_submission"
    data: ["org_id", "program_id", "documents", "timestamp"]
    retention: "10_years"
```

---

## 6. Monitoring & Observability

### 6.1 Key Metrics
```yaml
metrics:
  performance:
    - name: "embedding_generation_latency"
      type: "histogram"
      buckets: [10, 50, 100, 500, 1000, 5000]
      unit: "milliseconds"
    
    - name: "vector_search_latency"
      type: "histogram"
      buckets: [50, 100, 200, 500, 1000, 2000]
      unit: "milliseconds"
    
    - name: "match_accuracy"
      type: "gauge"
      calculation: "true_positives / (true_positives + false_positives)"
      target: 0.85
  
  business:
    - name: "programs_matched_per_org"
      type: "histogram"
      buckets: [0, 5, 10, 20, 50, 100]
    
    - name: "total_benefits_identified"
      type: "counter"
      unit: "dollars"
    
    - name: "successful_applications"
      type: "counter"
      tags: ["program_type", "industry", "state"]
```

### 6.2 Alerting Rules
```yaml
alerts:
  - name: "high_latency"
    condition: "p95(vector_search_latency) > 1000ms for 5m"
    severity: "warning"
    action: "scale_up_search_nodes"
  
  - name: "low_match_rate"
    condition: "match_accuracy < 0.7 for 1h"
    severity: "critical"
    action: "trigger_model_review"
  
  - name: "data_staleness"
    condition: "time_since_last_update > expected_frequency * 2"
    severity: "warning"
    action: "notify_data_team"
```

---

## 7. Testing Strategy

### 7.1 Test Data Generation
```python
class TestDataGenerator:
    def generate_test_organization(self, profile_type='random'):
        profiles = {
            'small_manufacturer': {
                'employees': random.randint(10, 50),
                'industry': 'Manufacturing',
                'naics': '3359',
                'state': 'IL',
                'revenue': random.randint(1000000, 5000000)
            },
            'tech_startup': {
                'employees': random.randint(5, 25),
                'industry': 'Technology',
                'naics': '5112',
                'state': random.choice(['CA', 'NY', 'TX']),
                'revenue': random.randint(500000, 2000000)
            }
        }
        
        return Organization(**profiles.get(
            profile_type, 
            self.generate_random_profile()
        ))
```

### 7.2 Integration Tests
```python
class RAGIntegrationTests:
    def test_end_to_end_matching(self):
        # Create test organization
        org = self.create_test_org('small_manufacturer')
        
        # Generate embeddings
        embedding = self.rag.embed_organization(org)
        assert embedding.shape == (1536,)
        
        # Search for programs
        results = self.rag.search_programs(embedding)
        assert len(results) > 0
        
        # Validate eligibility
        eligible = self.rag.validate_eligibility(results[0], org)
        assert eligible.status in ['qualified', 'not_qualified']
        
        # Generate explanation
        explanation = self.rag.explain_match(results[0], org)
        assert len(explanation) > 0
```

---

## 8. Performance Requirements

### 8.1 Scalability Targets
- Support 100,000 concurrent vector searches
- Index 10,000 new programs per day
- Process 1M eligibility checks per hour
- Store 10TB of embedded documents
- Maintain sub-500ms p95 latency

### 8.2 Optimization Strategies
- Implement hierarchical indexing for multi-scale search
- Use approximate nearest neighbor algorithms (HNSW, IVF)
- Employ caching at embedding, search, and result levels
- Implement query batching for efficiency
- Use GPU acceleration for embedding generation

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Sept 2025 | RAG Team | Initial draft |

## Dependencies

- Parent PRD: BOIM Master PRD
- Related PRDs: Profile Builder PRD, Application Automation PRD
- External APIs: Grants.gov, IRS.gov, State databases
- Infrastructure: Vector database, GPU cluster, Kafka cluster