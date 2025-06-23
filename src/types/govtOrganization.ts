export type GovtOrganization = {
  id: string;
  active: boolean;
  org_type: "govt";
  name: string;
  description: string | null;
  metadata: {
    country: string;
    govt_org_type: string;
    govt_org_children_type: string;
  };
  level_cache: number;
  system_generated: boolean;
  has_children: boolean;
  parent: GovtOrganization | null;
};
