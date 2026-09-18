/**
 * Representative Greenhouse Job Board API payloads (GET .../jobs?content=true).
 * Trimmed but structurally faithful to real responses. No live network.
 */

export const greenhouseListResponse = {
  jobs: [
    {
      id: 4012345,
      internal_job_id: 3011111,
      title: "Senior Backend Engineer",
      updated_at: "2024-07-15T10:20:30-04:00",
      requisition_id: "R-1001",
      location: { name: "Bengaluru, India" },
      absolute_url: "https://boards.greenhouse.io/acme/jobs/4012345",
      company_name: "Acme Inc",
      first_published: "2024-07-01T09:00:00-04:00",
      metadata: [
        { id: 1, name: "Employment Type", value: "Full-time", value_type: "single_select" },
      ],
      departments: [{ id: 10, name: "Engineering" }],
      offices: [{ id: 20, name: "Bengaluru" }],
      content:
        "&lt;div&gt;&lt;p&gt;We&#39;re hiring a &lt;strong&gt;Senior Backend Engineer&lt;/strong&gt; to build APIs &amp; services.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;5+ years&lt;/li&gt;&lt;/ul&gt;&lt;/div&gt;",
    },
    {
      id: 4012346,
      title: "Product Designer (Remote)",
      updated_at: "2024-07-14T08:00:00-04:00",
      location: { name: "Remote - US" },
      absolute_url: "https://boards.greenhouse.io/acme/jobs/4012346",
      departments: [{ id: 11, name: "Design" }],
      offices: [],
      metadata: [],
      content: "&lt;p&gt;Own the end-to-end design of our core product.&lt;/p&gt;",
    },
    {
      // no title → must be dropped by the adapter, not crash the run
      id: 4012347,
      title: "   ",
      location: { name: "London, UK" },
      absolute_url: "https://boards.greenhouse.io/acme/jobs/4012347",
      content: "&lt;p&gt;x&lt;/p&gt;",
    },
    {
      // no id → dropped
      title: "Ghost Role",
      absolute_url: "not-a-url",
      content: "&lt;p&gt;y&lt;/p&gt;",
    },
  ],
  meta: { total: 4 },
};

export const greenhouseEmptyResponse = { jobs: [], meta: { total: 0 } };

export const greenhouseMalformedResponse = { data: "nope" };
