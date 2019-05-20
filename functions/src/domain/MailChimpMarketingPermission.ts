class MailChimpMarketingPermission {
  marketing_permission_id!: string;
  enabled!: boolean;

  constructor(id: string, enabled: boolean = true) {
    this.marketing_permission_id = id;
    this.enabled = enabled;
  }
}

export default MailChimpMarketingPermission;
