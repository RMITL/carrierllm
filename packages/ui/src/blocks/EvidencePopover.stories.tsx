import type { Meta, StoryObj } from '@storybook/react';
import { EvidencePopover } from './EvidencePopover';

const meta: Meta<typeof EvidencePopover> = {
  title: 'Blocks/EvidencePopover',
  component: EvidencePopover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCitations = [
  {
    chunkId: 'fg_chunk_42',
    snippet: 'Exam-Free underwriting available for ages 0-60 through $1,000,000 face amount with simplified medical questions.',
    documentTitle: 'F&G 2025 Underwriting Guide',
    effectiveDate: '2025-01-01',
    page: 15,
    section: 'Exam-Free Eligibility'
  },
  {
    chunkId: 'fg_chunk_43',
    snippet: 'Build chart allowances permit BMI up to 32 for standard plus class with no additional requirements.',
    documentTitle: 'F&G Build Chart Reference',
    effectiveDate: '2024-12-15',
    page: 8,
    section: 'Standard Plus Criteria'
  }
];

export const Default: Story = {
  args: {
    citations: mockCitations,
  },
};

export const WithCustomTrigger: Story = {
  args: {
    citations: mockCitations,
    trigger: (
      <span className="flex items-center gap-1 text-blue-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Sources
      </span>
    ),
  },
};

export const SingleCitation: Story = {
  args: {
    citations: [mockCitations[0]],
  },
};

export const NoCitations: Story = {
  args: {
    citations: [],
  },
};

export const LongSnippet: Story = {
  args: {
    citations: [
      {
        chunkId: 'long_chunk',
        snippet: 'This is a much longer citation snippet that demonstrates how the popover handles extensive text content. It includes detailed underwriting guidelines, specific medical requirements, age and amount limitations, and other comprehensive criteria that carriers use to evaluate risk. The text wraps appropriately and maintains readability within the popover interface.',
        documentTitle: 'Comprehensive Underwriting Manual',
        effectiveDate: '2024-11-01',
        page: 157,
        section: 'Complex Medical Conditions'
      }
    ],
  },
};