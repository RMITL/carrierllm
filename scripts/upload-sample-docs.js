#!/usr/bin/env node

/**
 * Script to upload sample carrier documents with underwriting language
 * This creates test data for the RAG citation system
 */

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';

// Sample underwriting content for different carriers
const sampleDocuments = [
  {
    carrierId: 'fg-life',
    title: 'F&G Life IUL Underwriting Guide 2025',
    effectiveDate: '2025-01-01',
    content: {
      sections: [
        {
          title: 'Accelerated Underwriting Program',
          content: `
            F&G Life Accelerated Underwriting (ExamFree IUL):
            - Available for ages 18-60
            - Face amounts: $100,000 to $1,000,000
            - No medical exam required for qualified applicants
            - BMI requirements: 18.5 to 35.0
            - Non-tobacco rates available after 12 months cessation
            - Tobacco use includes cigarettes, e-cigarettes, vaping, and nicotine replacement therapy

            Disqualifiers for Accelerated Path:
            - Diabetes Type 1 or uncontrolled Type 2
            - Cardiac history within past 5 years
            - Cancer treatment within past 10 years (except basal cell skin cancer)
            - Current marijuana use more than 4x per week
            - DUI/DWI within past 5 years
          `
        },
        {
          title: 'Build Chart Requirements',
          content: `
            Height/Weight Guidelines for Standard Plus Rates:
            Male, Age 40-49:
            - 5'8" (68"): Min 125 lbs, Max 197 lbs (BMI 19.0-30.0)
            - 5'10" (70"): Min 132 lbs, Max 209 lbs (BMI 19.0-30.0)
            - 6'0" (72"): Min 140 lbs, Max 221 lbs (BMI 19.0-30.0)

            Female, Age 40-49:
            - 5'4" (64"): Min 110 lbs, Max 175 lbs (BMI 18.9-30.0)
            - 5'6" (66"): Min 115 lbs, Max 186 lbs (BMI 18.8-30.0)
            - 5'8" (68"): Min 122 lbs, Max 197 lbs (BMI 18.5-30.0)
          `
        }
      ]
    }
  },
  {
    carrierId: 'moo',
    title: 'Mutual of Omaha Term Life Underwriting Manual 2025',
    effectiveDate: '2025-01-01',
    content: {
      sections: [
        {
          title: 'Tobacco and Nicotine Guidelines',
          content: `
            Non-Tobacco Classification Requirements:
            - No cigarette use in past 24 months
            - Cigar use: Up to 24 cigars per year may qualify for non-tobacco with negative cotinine test
            - E-cigarette/vaping: Considered tobacco use, requires 24 months cessation
            - Marijuana use: Acceptable for non-tobacco if no tobacco/nicotine products used
            - Nicotine replacement therapy: Considered tobacco use during treatment

            Preferred Plus Non-Tobacco:
            - No tobacco/nicotine use in past 5 years
            - Negative cotinine test required
            - No history of tobacco-related illness
          `
        },
        {
          title: 'Financial Underwriting',
          content: `
            Income Replacement Guidelines:
            - Ages 18-40: Up to 30x annual income
            - Ages 41-50: Up to 25x annual income
            - Ages 51-60: Up to 20x annual income
            - Ages 61-70: Up to 10x annual income

            Financial Documentation Required:
            - $1M-$2.5M: Recent tax return or W2
            - $2.5M-$5M: 2 years tax returns, financial statement
            - Over $5M: Full financial package including business financials
          `
        }
      ]
    }
  },
  {
    carrierId: 'protective',
    title: 'Protective Life Underwriting Guidelines 2025',
    effectiveDate: '2025-01-01',
    content: {
      sections: [
        {
          title: 'Medical Conditions - Diabetes',
          content: `
            Diabetes Type 2 Underwriting:

            Preferred Rates Available if:
            - Diagnosed after age 50
            - HbA1c consistently under 7.0%
            - No diabetic complications (retinopathy, neuropathy, nephropathy)
            - Well-controlled with oral medication only
            - BMI under 32
            - No tobacco use

            Standard Rates:
            - HbA1c 7.0-8.5%
            - Controlled with insulin acceptable
            - Minor complications may be considered

            Substandard or Decline:
            - HbA1c over 9.0%
            - Multiple diabetic complications
            - Poor compliance with treatment
          `
        },
        {
          title: 'Aviation and Avocations',
          content: `
            Private Pilot Coverage:
            - Standard rates available for experienced pilots
            - Requirements: 100+ total hours, 25+ hours in past year
            - Valid medical certificate required
            - No aerobatics, crop dusting, or experimental aircraft

            Scuba Diving:
            - Recreational diving to 100 feet: Standard rates
            - 100-130 feet with advanced certification: Standard to Table 2
            - Technical/cave diving: Individual consideration

            Foreign Travel:
            - Most countries: No rating
            - High-risk areas: Postpone or decline
            - Extended stays (>6 months): Individual consideration
          `
        }
      ]
    }
  }
];

/**
 * Create a mock PDF-like text document from structured content
 */
function createDocumentText(doc) {
  let text = `${doc.title}\nEffective Date: ${doc.effectiveDate}\n\n`;

  doc.content.sections.forEach((section, index) => {
    text += `Section ${index + 1}: ${section.title}\n\n`;
    text += section.content.trim() + '\n\n';
    text += '---\n\n';
  });

  return text;
}

/**
 * Upload a document to the worker
 */
async function uploadDocument(doc) {
  const formData = new FormData();

  // Create a mock PDF file from text
  const documentText = createDocumentText(doc);
  const blob = new Blob([documentText], { type: 'text/plain' });
  const file = new File([blob], `${doc.carrierId}-underwriting-guide.txt`, { type: 'text/plain' });

  formData.append('file', file);
  formData.append('carrierId', doc.carrierId);
  formData.append('title', doc.title);
  formData.append('effectiveDate', doc.effectiveDate);
  formData.append('docType', 'underwriting_guide');

  try {
    const response = await fetch(`${WORKER_URL}/api/carriers/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✓ Uploaded ${doc.title}:`, result.message);
      return result;
    } else {
      console.error(`✗ Failed to upload ${doc.title}:`, result.message);
      return null;
    }
  } catch (error) {
    console.error(`✗ Error uploading ${doc.title}:`, error.message);
    return null;
  }
}

/**
 * Main function to upload all sample documents
 */
async function main() {
  console.log('Uploading sample carrier documents for RAG citations...\n');

  const results = [];

  for (const doc of sampleDocuments) {
    console.log(`Processing ${doc.carrierId}...`);
    const result = await uploadDocument(doc);
    if (result) {
      results.push(result);
    }
    // Small delay between uploads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== Upload Summary ===');
  console.log(`Successfully uploaded: ${results.length}/${sampleDocuments.length} documents`);

  const totalChunks = results.reduce((sum, r) => sum + (r.chunks || 0), 0);
  console.log(`Total chunks indexed: ${totalChunks}`);

  if (results.length === sampleDocuments.length) {
    console.log('\n✅ All sample documents uploaded successfully!');
    console.log('The RAG citation system should now return proper underwriting evidence.');
  } else {
    console.log('\n⚠️ Some uploads failed. Check the error messages above.');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadDocument, sampleDocuments };