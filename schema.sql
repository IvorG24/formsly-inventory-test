DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public
  AUTHORIZATION postgres;

-- Remove all policies for files
DROP POLICY IF EXISTS objects_policy ON storage.objects;
DROP POLICY IF EXISTS buckets_policy ON storage.buckets;

-- Delete file buckets created and files uploaded
DELETE FROM storage.objects;
DELETE FROM storage.buckets;

-- Allow all to access storage
CREATE POLICY objects_policy ON storage.objects FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY buckets_policy ON storage.buckets FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name) VALUES ('USER_AVATARS', 'USER_AVATARS');
INSERT INTO storage.buckets (id, name) VALUES ('USER_SIGNATURES', 'USER_SIGNATURES');
INSERT INTO storage.buckets (id, name) VALUES ('TEAM_LOGOS', 'TEAM_LOGOS');
INSERT INTO storage.buckets (id, name) VALUES ('COMMENT_ATTACHMENTS', 'COMMENT_ATTACHMENTS');
INSERT INTO storage.buckets (id, name) VALUES ('REQUEST_ATTACHMENTS', 'REQUEST_ATTACHMENTS');

UPDATE storage.buckets SET public = true;

---------- Start: TABLES

-- Start: Attachments
CREATE TABLE attachment_table (
    attachment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
    attachment_name VARCHAR(4000) NOT NULL,
    attachment_value VARCHAR(4000) NOT NULL,
    attachment_bucket VARCHAR(4000) NOT NULL,
    attachment_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    attachment_is_disabled BOOLEAN DEFAULT FALSE NOT NULL
);
-- End: Attachments

-- Start: User and Teams
CREATE TABLE user_table (
    -- temporary
    user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
    user_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_username VARCHAR(4000) UNIQUE NOT NULL,
    user_first_name VARCHAR(4000) NOT NULL,
    user_last_name VARCHAR(4000) NOT NULL,
    user_email VARCHAR(4000) UNIQUE NOT NULL,
    user_job_title VARCHAR(4000),
    user_phone_number VARCHAR(4000),
    user_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
    user_active_team_id UUID,
    user_active_app VARCHAR(4000) DEFAULT 'REQUEST' NOT NULL,
    user_avatar VARCHAR(4000),

    user_signature_attachment_id UUID REFERENCES attachment_table(attachment_id)
);
CREATE TABLE team_table (
  team_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  team_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  team_name VARCHAR(4000) UNIQUE NOT NULL,
  team_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
  team_is_request_signature_required BOOLEAN DEFAULT FALSE NOT NULL,
  team_logo VARCHAR(4000),
  
  team_user_id UUID REFERENCES user_table(user_id) NOT NULL
);
CREATE TABLE team_member_table(
  team_member_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  team_member_role VARCHAR(4000) DEFAULT 'MEMBER' NOT NULL,
  team_member_date_created DATE DEFAULT NOW() NOT NULL,
  team_member_is_disabled BOOL DEFAULT FALSE NOT NULL,

  team_member_user_id UUID REFERENCES user_table(user_id) NOT NULL,
  team_member_team_id UUID REFERENCES team_table(team_id) NOT NULL,
  UNIQUE (team_member_team_id, team_member_user_id)
);
CREATE TABLE team_group_table(
  team_group_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  team_group_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  team_group_name VARCHAR(4000) NOT NULL,
  team_group_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,

  team_group_team_id UUID REFERENCES team_table(team_id) NOT NULL
);
CREATE TABLE team_project_table(
  team_project_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  team_project_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  team_project_name VARCHAR(4000) NOT NULL,
  team_project_code VARCHAR(4000) NOT NULL,
  team_project_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,

  team_project_team_id UUID REFERENCES team_table(team_id) NOT NULL
);
CREATE TABLE team_group_member_table(
  team_group_member_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  team_member_id UUID REFERENCES team_member_table(team_member_id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
  team_group_id UUID REFERENCES team_group_table(team_group_id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,

  UNIQUE(team_group_id, team_member_id) 
);
CREATE TABLE team_project_member_table(
  team_project_member_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  team_member_id UUID REFERENCES team_member_table(team_member_id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
  team_project_id UUID REFERENCES team_project_table(team_project_id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
  
  UNIQUE(team_project_id, team_member_id) 
);

-- End: User and Teams

-- Start: Notification and Invitation
CREATE TABLE notification_table (
  notification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  notification_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notification_content VARCHAR(4000) NOT NULL,
  notification_is_read  BOOLEAN DEFAULT FALSE NOT NULL,
  notification_redirect_url VARCHAR(4000),
  notification_type VARCHAR(4000) NOT NULL,
  notification_app VARCHAR(4000) NOT NULL,

  notification_team_id UUID REFERENCES team_table(team_id),
  notification_user_id UUID REFERENCES user_table(user_id) NOT NULL
);
CREATE TABLE invitation_table (
  invitation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  invitation_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  invitation_to_email VARCHAR(4000) NOT NULL,
  invitation_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
  invitation_status VARCHAR(4000) DEFAULT 'PENDING' NOT NULL,

  invitation_from_team_member_id UUID REFERENCES team_member_table(team_member_id) NOT NULL
);
-- End: Notification and Invitation

-- Start: Form
CREATE TABLE form_table(
  form_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  form_name VARCHAR(4000) NOT NULL,
  form_description VARCHAR(4000) NOT NULL,
  form_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  form_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
  form_is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
  form_is_signature_required BOOLEAN DEFAULT FALSE NOT NULL,
  form_is_formsly_form BOOLEAN DEFAULT FALSE NOT NULL,
  form_app VARCHAR(4000) NOT NULL,
  form_is_for_every_member BOOLEAN DEFAULT TRUE NOT NULL,

  form_team_member_id UUID REFERENCES team_member_table(team_member_id) NOT NULL
);
CREATE TABLE signer_table (
  signer_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  signer_is_primary_signer BOOLEAN DEFAULT FALSE NOT NULL,
  signer_action VARCHAR(4000) NOT NULL,
  signer_order INT NOT NULL,
  signer_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,

  signer_form_id UUID REFERENCES form_table(form_id) NOT NULL,
  signer_team_member_id UUID REFERENCES team_member_table(team_member_id) NOT NULL,
  signer_team_project_id UUID REFERENCES team_project_table(team_project_id)
);
CREATE TABLE section_table (
  section_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  section_name VARCHAR(4000) NOT NULL,
  section_order INT NOT NULL,
  section_is_duplicatable BOOLEAN DEFAULT FALSE NOT NULL,

  section_form_id UUID REFERENCES form_table(form_id) NOT NULL
);
CREATE TABLE field_table (
  field_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  field_name VARCHAR(4000) NOT NULL,
  field_description VARCHAR(4000),
  field_is_required  BOOLEAN DEFAULT FALSE NOT NULL,
  field_type VARCHAR(4000) NOT NULL,
  field_order INT NOT NULL,
  field_is_positive_metric BOOLEAN DEFAULT TRUE NOT NULL,
  field_is_read_only BOOLEAN DEFAULT FALSE NOT NULL,

  field_section_id UUID REFERENCES section_table(section_id) NOT NULL
);
CREATE TABLE option_table (
  option_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  option_value VARCHAR(4000) NOT NULL,
  option_description VARCHAR(4000),
  option_order INT NOT NULL,

  option_field_id UUID REFERENCES field_table(field_id) NOT NULL
);
CREATE TABLE form_team_group_table(
  form_team_group_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  form_id UUID REFERENCES form_table(form_id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
  team_group_id UUID REFERENCES team_group_table(team_group_id) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,

  UNIQUE(form_id, team_group_id) 
);
-- End: Form

-- Start: Request
CREATE TABLE request_table(
  request_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  request_formsly_id VARCHAR(4000) UNIQUE,
  request_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  request_status VARCHAR(4000) DEFAULT 'PENDING' NOT NULL,
  request_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,

  request_team_member_id UUID REFERENCES team_member_table(team_member_id),
  request_form_id UUID REFERENCES form_table(form_id) NOT NULL,
  request_project_id UUID REFERENCES team_project_table(team_project_id)
);
CREATE TABLE request_response_table(
  request_response_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  request_response VARCHAR(4000) NOT NULL,
  request_response_duplicatable_section_id UUID,

  request_response_request_id UUID REFERENCES request_table(request_id) NOT NULL,
  request_response_field_id UUID REFERENCES field_table(field_id) NOT NULL
);
CREATE TABLE request_signer_table(
  request_signer_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  request_signer_status VARCHAR(4000) DEFAULT 'PENDING' NOT NULL,

  request_signer_request_id UUID REFERENCES request_table(request_id) NOT NULL,
  request_signer_signer_id UUID REFERENCES signer_table(signer_id) NOT NULL
);
-- End: Request

-- Start: Comments
CREATE TABLE comment_table(
  comment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
  comment_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  comment_content VARCHAR(4000),
  comment_is_edited  BOOLEAN DEFAULT FALSE,
  comment_last_updated TIMESTAMPTZ,
  comment_is_disabled  BOOLEAN DEFAULT FALSE NOT NULL,
  comment_type VARCHAR(4000) NOT NULL,

  comment_request_id UUID REFERENCES request_table(request_id) NOT NULL,
  comment_team_member_id UUID REFERENCES team_member_table(team_member_id) NOT NULL
);
-- End: Comments

-- Start: Requisition Form
CREATE TABLE item_table(
  item_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  item_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  item_general_name VARCHAR(4000) NOT NULL,
  item_unit VARCHAR(4000) NOT NULL,
  item_is_available BOOLEAN DEFAULT TRUE NOT NULL,
  item_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
  item_gl_account VARCHAR(4000) NOT NULL,
  item_division_id VARCHAR(4000) NOT NULL,

  item_team_id UUID REFERENCES team_table(team_id) NOT NULL
);

CREATE TABLE item_description_table(
  item_description_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  item_description_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  item_description_label VARCHAR(4000) NOT NULL,
  item_description_is_available BOOLEAN DEFAULT TRUE NOT NULL,
  item_description_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,

  item_description_field_id UUID REFERENCES field_table(field_id) ON DELETE CASCADE NOT NULL,
  item_description_item_id UUID REFERENCES item_table(item_id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE item_description_field_table(
  item_description_field_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  item_description_field_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  item_description_field_value VARCHAR(4000) NOT NULL,
  item_description_field_is_available BOOLEAN DEFAULT TRUE NOT NULL,
  item_description_field_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,

  item_description_field_item_description_id UUID REFERENCES item_description_table(item_description_id) ON DELETE CASCADE NOT NULL
);

-- End: Requisition Form

-- Start: Quotation Form

CREATE TABLE supplier_table(
  supplier_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  supplier_date_created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  supplier_is_available BOOLEAN DEFAULT TRUE NOT NULL,
  supplier_is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
  supplier_name VARCHAR(4000) NOT NULL,

  supplier_team_id UUID REFERENCES team_table(team_id) NOT NULL
);

-- End: Quotation Form

CREATE TABLE csi_code_table(
  csi_code_id UUID DEFAULT uuid_generate_v4() UNIQUE PRIMARY KEY NOT NULL,
  csi_code_section VARCHAR(4000) NOT NULL,
  csi_code_division_id VARCHAR(4000) NOT NULL,
  csi_code_division_description VARCHAR(4000) NOT NULL,
  csi_code_level_two_major_group_id VARCHAR(4000) NOT NULL,
  csi_code_level_two_major_group_description VARCHAR(4000) NOT NULL,
  csi_code_level_two_minor_group_id VARCHAR(4000) NOT NULL,
  csi_code_level_two_minor_group_description VARCHAR(4000) NOT NULL,
  csi_code_level_three_id VARCHAR(4000) NOT NULL,
  csi_code_level_three_description VARCHAR(4000) NOT NULL
);

---------- End: TABLES

---------- Start: FUNCTIONS

-- Start: Get current date

CREATE OR REPLACE FUNCTION get_current_date()
RETURNS TIMESTAMPTZ
AS $$
BEGIN
    RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- End: Get current date

-- Extensions
CREATE EXTENSION IF NOT EXISTS plv8;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" with schema extensions;

-- Start: Get SSOT

CREATE OR REPLACE FUNCTION get_ssot(
    input_data JSON
)
RETURNS JSON as $$
  let ssot_data;
  plv8.subtransaction(function(){
    const {
      activeTeam,
      pageNumber,
      rowLimit,
      search,
      requisitionFilter,
      requisitionFilterCount,
      supplierList
    } = input_data;

    const rowStart = (pageNumber - 1) * rowLimit;

    // Fetch owner of team
    const team_owner = plv8.execute(`SELECT * FROM team_member_table WHERE team_member_team_id='${activeTeam}' AND team_member_role='OWNER'`)[0];

    // Fetch team formsly forms
    const requisition_form = plv8.execute(`SELECT * FROM form_table WHERE form_name='Requisition' AND form_is_formsly_form=true AND form_team_member_id='${team_owner.team_member_id}'`)[0];
    const sourced_item_form = plv8.execute(`SELECT * FROM form_table WHERE form_name='Sourced Item' AND form_is_formsly_form=true AND form_team_member_id='${team_owner.team_member_id}'`)[0];
    const quotation_form = plv8.execute(`SELECT * FROM form_table WHERE form_name='Quotation' AND form_is_formsly_form=true AND form_team_member_id='${team_owner.team_member_id}'`)[0];
    const rir_form = plv8.execute(`SELECT * FROM form_table WHERE form_name='Receiving Inspecting Report' AND form_is_formsly_form=true AND form_team_member_id='${team_owner.team_member_id}'`)[0];
    const ro_form = plv8.execute(`SELECT * FROM form_table WHERE form_name='Release Order' AND form_is_formsly_form=true AND form_team_member_id='${team_owner.team_member_id}'`)[0];
    const transfer_receipt_form = plv8.execute(`SELECT * FROM form_table WHERE form_name='Transfer Receipt' AND form_is_formsly_form=true AND form_team_member_id='${team_owner.team_member_id}'`)[0];

    let requisition_requests;
    let searchCondition = '';
    let condition = '';
    let supplierCondition = '';
    
    if(search.length !== 0){
      searchCondition = `request_table.request_formsly_id ILIKE '%' || '${search}' || '%'`;
    }

    if(requisitionFilterCount || supplierList.length !== 0){
      if(requisitionFilterCount){
        condition = requisitionFilter.map(value => `request_response_table.request_response = '"${value}"'`).join(' OR ');
      }

      if(supplierList.length !== 0){
        const quotationCondition = supplierList.map(supplier => `request_response_table.request_response='"${supplier}"'`).join(" OR ");
        const quotationRequestIdList = plv8.execute(`SELECT request_table.request_id FROM request_response_table INNER JOIN request_table ON request_response_table.request_response_request_id=request_table.request_id WHERE request_table.request_status='APPROVED' AND request_table.request_form_id='${quotation_form.form_id}' AND (${quotationCondition})`);

        if(quotationRequestIdList.length === 0){
          ssot_data = [];
          return;
        }

        const sectionId = plv8.execute(`SELECT section_id FROM section_table WHERE section_form_id='${quotation_form.form_id}' AND section_name='ID'`)[0];
        const fieldId = plv8.execute(`SELECT field_id FROM field_table WHERE field_section_id='${sectionId.section_id}' AND field_name='Requisition ID'`)[0];

        const requisitionCondition = quotationRequestIdList.map(requestId => `(request_response_request_id='${requestId.request_id}' AND request_response_field_id='${fieldId.field_id}')`).join(" OR ");
        const requisitionIdList = plv8.execute(`SELECT request_response FROM request_response_table WHERE ${requisitionCondition}`);

        supplierCondition = requisitionIdList.map(requestId => `request_table.request_id = '${JSON.parse(requestId.request_response)}'`).join(' OR ');
      }

      let orCondition = [...(condition ? [`${condition}`] : []), ...(searchCondition ? [`${searchCondition}`] : [])].join(' OR ');

      requisition_requests = plv8.execute(
        `
          SELECT * FROM (
            SELECT 
              request_table.request_id, 
              request_table.request_formsly_id,
              request_table.request_date_created, 
              request_table.request_team_member_id, 
              request_response_table.request_response, 
              ROW_NUMBER() OVER (PARTITION BY request_table.request_id) AS RowNumber 
            FROM request_table INNER JOIN request_response_table ON request_table.request_id = request_response_table.request_response_request_id 
            WHERE 
              request_table.request_status = 'APPROVED'
              AND request_table.request_form_id = '${requisition_form.form_id}'
              AND (
                ${[...(orCondition ? [`${orCondition}`] : []), ...(supplierCondition ? [`${supplierCondition}`] : [])].join(' AND ')}
              )
            ORDER BY request_table.request_date_created DESC
          ) AS a 
          WHERE a.RowNumber = ${requisitionFilterCount ? requisitionFilterCount : 1}
          OFFSET ${rowStart} 
          ROWS FETCH FIRST ${rowLimit} ROWS ONLY
        `
      );
          
    }else{
      requisition_requests = plv8.execute(`SELECT request_id, request_formsly_id, request_date_created, request_team_member_id FROM request_table WHERE request_status='APPROVED' AND request_form_id='${requisition_form.form_id}' ORDER BY request_date_created DESC OFFSET ${rowStart} ROWS FETCH FIRST ${rowLimit} ROWS ONLY`);
    }

    
    
    ssot_data = requisition_requests.map((requisition) => {
      // Requisition request response
      const requisition_response = plv8.execute(`SELECT request_response, request_response_field_id, request_response_duplicatable_section_id FROM request_response_table WHERE request_response_request_id='${requisition.request_id}'`);
      
      if(!requisition_response) return;

      // Requisition request response with fields
      const requisition_response_fields = requisition_response.map(response => {
        const field = plv8.execute(`SELECT field_name, field_type FROM field_table WHERE field_id='${response.request_response_field_id}'`)[0];

        return {
          request_response: response.request_response,
          request_response_field_name: field.field_name,
          request_response_field_type: field.field_type,
          request_response_duplicatable_section_id: response.request_response_duplicatable_section_id
        }
      });

      // Requisition team member
      const requisition_team_member = plv8.execute(`SELECT user_table.user_first_name, user_table.user_last_name FROM team_member_table INNER JOIN user_table ON team_member_table.team_member_user_id = user_id WHERE team_member_id='${requisition.request_team_member_id}'`)[0];

      const quotation_ids = plv8.execute(`SELECT request_table.request_id FROM request_response_table INNER JOIN request_table ON request_response_table.request_response_request_id=request_table.request_id WHERE request_response_table.request_response='"${requisition.request_id}"' AND request_table.request_status='APPROVED' AND request_table.request_form_id='${quotation_form.form_id}'`);
      let quotation_list = [];
      if(quotation_ids.length !== 0){
        let quotation_condition = "";
        quotation_ids.forEach(quotation => {
          quotation_condition += `request_id='${quotation.request_id}' OR `;
        });

        const quotation_requests = plv8.execute(`SELECT request_id, request_formsly_id, request_date_created, request_team_member_id FROM request_table WHERE ${quotation_condition.slice(0, -4)} ORDER BY request_date_created DESC`);
        quotation_list = quotation_requests.map(quotation => {
          // Quotation request response
          const quotation_response = plv8.execute(`SELECT request_response, request_response_field_id FROM request_response_table WHERE request_response_request_id='${quotation.request_id}'`);
          
          // Quotation request response with fields
          const quotation_response_fields = quotation_response.map(response => {
            const field = plv8.execute(`SELECT field_name, field_type FROM field_table WHERE field_id='${response.request_response_field_id}'`)[0];
            return {
              request_response: response.request_response,
              request_response_field_name: field.field_name,
              request_response_field_type: field.field_type,
            }
          });

          // Quotation team member
          const quotation_team_member = plv8.execute(`SELECT user_table.user_first_name, user_table.user_last_name FROM team_member_table INNER JOIN user_table ON team_member_table.team_member_user_id = user_id WHERE team_member_id='${quotation.request_team_member_id}'`)[0];

          const rir_ids = plv8.execute(`SELECT request_table.request_id FROM request_response_table INNER JOIN request_table ON request_response_table.request_response_request_id=request_table.request_id WHERE request_response_table.request_response='"${quotation.request_id}"' AND request_table.request_status='APPROVED' AND request_table.request_form_id='${rir_form.form_id}'`);
          let rir_list = [];
          
          if(rir_ids.length !== 0){
            let rir_condition = "";
            rir_ids.forEach(rir => {
              rir_condition += `request_id='${rir.request_id}' OR `;
            });

            const rir_requests = plv8.execute(`SELECT request_id, request_formsly_id, request_date_created, request_team_member_id FROM request_table WHERE ${rir_condition.slice(0, -4)} ORDER BY request_date_created DESC`);
            rir_list = rir_requests.map(rir => {
              // rir request response
              const rir_response = plv8.execute(`SELECT request_response, request_response_field_id FROM request_response_table WHERE request_response_request_id='${rir.request_id}'`);
              
              // rir request response with fields
              const rir_response_fields = rir_response.map(response => {
                const field = plv8.execute(`SELECT field_name, field_type FROM field_table WHERE field_id='${response.request_response_field_id}'`)[0];
                return {
                  request_response: response.request_response,
                  request_response_field_name: field.field_name,
                  request_response_field_type: field.field_type,
                }
              });

              // rir team member
              const rir_team_member = plv8.execute(`SELECT user_table.user_first_name, user_table.user_last_name FROM team_member_table INNER JOIN user_table ON team_member_table.team_member_user_id = user_id WHERE team_member_id='${rir.request_team_member_id}'`)[0];

              return {
                rir_request_id: rir.request_id,
                rir_request_formsly_id: rir.request_formsly_id,
                rir_request_date_created: rir.request_date_created,
                rir_request_response: rir_response_fields,
                rir_request_owner: rir_team_member,
              }
            });
          }

          return {
            quotation_request_id: quotation.request_id,
            quotation_request_formsly_id: quotation.request_formsly_id,
            quotation_request_date_created: quotation.request_date_created,
            quotation_request_response: quotation_response_fields,
            quotation_request_owner: quotation_team_member,
            quotation_rir_request: rir_list
          }
        });
      }

      const sourced_item_ids = plv8.execute(`SELECT request_table.request_id FROM request_response_table INNER JOIN request_table ON request_response_table.request_response_request_id=request_table.request_id WHERE request_response_table.request_response='"${requisition.request_id}"' AND request_table.request_status='APPROVED' AND request_table.request_form_id='${sourced_item_form.form_id}'`);
      let sourced_item_list = [];
      if(sourced_item_ids.length !== 0){
        let sourced_item_condition = "";
        sourced_item_ids.forEach(sourced_item => {
          sourced_item_condition += `request_id='${sourced_item.request_id}' OR `;
        });

        const sourced_item_requests = plv8.execute(`SELECT request_id, request_formsly_id, request_date_created, request_team_member_id FROM request_table WHERE ${sourced_item_condition.slice(0, -4)} ORDER BY request_date_created DESC`);
        sourced_item_list = sourced_item_requests.map(sourced_item => {
          // Sourced Item request response
          const sourced_item_response = plv8.execute(`SELECT request_response, request_response_field_id FROM request_response_table WHERE request_response_request_id='${sourced_item.request_id}'`);
          
          // Sourced Item request response with fields
          const sourced_item_response_fields = sourced_item_response.map(response => {
            const field = plv8.execute(`SELECT field_name, field_type FROM field_table WHERE field_id='${response.request_response_field_id}'`)[0];
            return {
              request_response: response.request_response,
              request_response_field_name: field.field_name,
              request_response_field_type: field.field_type,
            }
          });

          // Sourced Item team member
          const sourced_item_team_member = plv8.execute(`SELECT user_table.user_first_name, user_table.user_last_name FROM team_member_table INNER JOIN user_table ON team_member_table.team_member_user_id = user_id WHERE team_member_id='${sourced_item.request_team_member_id}'`)[0];

          const ro_ids = plv8.execute(`SELECT request_table.request_id FROM request_response_table INNER JOIN request_table ON request_response_table.request_response_request_id=request_table.request_id WHERE request_response_table.request_response='"${sourced_item.request_id}"' AND request_table.request_status='APPROVED' AND request_table.request_form_id='${ro_form.form_id}'`);
          let ro_list = [];
          
          if(ro_ids.length !== 0){
            let ro_condition = "";
            ro_ids.forEach(ro => {
              ro_condition += `request_id='${ro.request_id}' OR `;
            });

            const ro_requests = plv8.execute(`SELECT request_id, request_formsly_id, request_date_created, request_team_member_id FROM request_table WHERE ${ro_condition.slice(0, -4)} ORDER BY request_date_created DESC`);
            ro_list = ro_requests.map(ro => {
              // ro request response
              const ro_response = plv8.execute(`SELECT request_response, request_response_field_id FROM request_response_table WHERE request_response_request_id='${ro.request_id}'`);
              
              // ro request response with fields
              const ro_response_fields = ro_response.map(response => {
                const field = plv8.execute(`SELECT field_name, field_type FROM field_table WHERE field_id='${response.request_response_field_id}'`)[0];
                return {
                  request_response: response.request_response,
                  request_response_field_name: field.field_name,
                  request_response_field_type: field.field_type,
                }
              });

              // ro team member
              const ro_team_member = plv8.execute(`SELECT user_table.user_first_name, user_table.user_last_name FROM team_member_table INNER JOIN user_table ON team_member_table.team_member_user_id = user_id WHERE team_member_id='${ro.request_team_member_id}'`)[0];

              const transfer_receipt_ids = plv8.execute(`SELECT request_table.request_id FROM request_response_table INNER JOIN request_table ON request_response_table.request_response_request_id=request_table.request_id WHERE request_response_table.request_response='"${ro.request_id}"' AND request_table.request_status='APPROVED' AND request_table.request_form_id='${transfer_receipt_form.form_id}'`);
              let transfer_receipt_list = [];
              
              if(transfer_receipt_ids.length !== 0){
                let transfer_receipt_condition = "";
                transfer_receipt_ids.forEach(transfer_receipt => {
                  transfer_receipt_condition += `request_id='${transfer_receipt.request_id}' OR `;
                });

                const transfer_receipt_requests = plv8.execute(`SELECT request_id, request_formsly_id, request_date_created, request_team_member_id FROM request_table WHERE ${transfer_receipt_condition.slice(0, -4)} ORDER BY request_date_created DESC`);
                transfer_receipt_list = transfer_receipt_requests.map(transfer_receipt => {
                  // transfer_receipt request response
                  const transfer_receipt_response = plv8.execute(`SELECT request_response, request_response_field_id FROM request_response_table WHERE request_response_request_id='${transfer_receipt.request_id}'`);
                  
                  // transfer_receipt request response with fields
                  const transfer_receipt_response_fields = transfer_receipt_response.map(response => {
                    const field = plv8.execute(`SELECT field_name, field_type FROM field_table WHERE field_id='${response.request_response_field_id}'`)[0];
                    return {
                      request_response: response.request_response,
                      request_response_field_name: field.field_name,
                      request_response_field_type: field.field_type,
                    }
                  });

                  // transfer_receipt team member
                  const transfer_receipt_team_member = plv8.execute(`SELECT user_table.user_first_name, user_table.user_last_name FROM team_member_table INNER JOIN user_table ON team_member_table.team_member_user_id = user_id WHERE team_member_id='${transfer_receipt.request_team_member_id}'`)[0];

                  return {
                    transfer_receipt_request_id: transfer_receipt.request_id,
                    transfer_receipt_request_formsly_id: transfer_receipt.request_formsly_id,
                    transfer_receipt_request_date_created: transfer_receipt.request_date_created,
                    transfer_receipt_request_response: transfer_receipt_response_fields,
                    transfer_receipt_request_owner: transfer_receipt_team_member,
                  }
                });
              }

              return {
                ro_request_id: ro.request_id,
                ro_request_formsly_id: ro.request_formsly_id,
                ro_request_date_created: ro.request_date_created,
                ro_request_response: ro_response_fields,
                ro_request_owner: ro_team_member,
                ro_transfer_receipt_request: transfer_receipt_list
              }
            });
          }

          return {
            sourced_item_request_id: sourced_item.request_id,
            sourced_item_request_formsly_id: sourced_item.request_formsly_id,
            sourced_item_request_date_created: sourced_item.request_date_created,
            sourced_item_request_response: sourced_item_response_fields,
            sourced_item_request_owner: sourced_item_team_member,
            sourced_item_ro_request: ro_list
          }
        });
      }

      

      return {
        requisition_request_id: requisition.request_id,
        requisition_request_formsly_id: requisition.request_formsly_id,
        requisition_request_date_created: requisition.request_date_created,
        requisition_request_response: requisition_response_fields,
        requisition_request_owner: requisition_team_member,
        requisition_quotation_request: quotation_list,
        requisition_sourced_item_request: sourced_item_list,
      }
    })
 });
 return ssot_data;
$$ LANGUAGE plv8;

-- End: Get SSOT

-- Start: Create user

CREATE OR REPLACE FUNCTION create_user(
    input_data JSON
)
RETURNS JSON AS $$
  let user_data;
  plv8.subtransaction(function(){
    const {
      user_id,
      user_email,
      user_first_name,
      user_last_name,
      user_username,
      user_avatar,
      user_phone_number,
      user_job_title
    } = input_data;

    user_data = plv8.execute(`INSERT INTO user_table (user_id,user_email,user_first_name,user_last_name,user_username,user_avatar,user_phone_number,user_job_title) VALUES ('${user_id}','${user_email}','${user_first_name}','${user_last_name}','${user_username}','${user_avatar}','${user_phone_number}','${user_job_title}') RETURNING *;`)[0];
    
    const invitation = plv8.execute(`SELECT invt.* ,teamt.team_name FROM invitation_table invt INNER JOIN team_member_table tmemt ON invt.invitation_from_team_member_id = tmemt.team_member_id INNER JOIN team_table teamt ON tmemt.team_member_team_id = teamt.team_id WHERE invitation_to_email='${user_email}';`)[0];

    if(invitation) plv8.execute(`INSERT INTO notification_table (notification_app,notification_content,notification_redirect_url,notification_type,notification_user_id) VALUES ('GENERAL','You have been invited to join ${invitation.team_name}','/team/invitation/${invitation.invitation_id}','INVITE','${user_id}') ;`);
    
 });
 return user_data;
$$ LANGUAGE plv8;

-- End: Create user

-- Start: Create request

CREATE OR REPLACE FUNCTION create_request(
    input_data JSON
)
RETURNS JSON AS $$
  let request_data;
  plv8.subtransaction(function(){
    const {
      requestId,
      formId,
      teamMemberId,
      responseValues,
      signerValues,
      notificationValues,
      formName,
      isFormslyForm,
      projectId
    } = input_data;

    let request_formsly_id = 'NULL';
    if(isFormslyForm===true) {
      const requestCount = plv8.execute(`SELECT COUNT(*) FROM REQUEST_TABLE WHERE request_form_id='${formId}' AND request_project_id='${projectId}';`)[0].count;
      const newCount = (Number(requestCount) + 1).toString(36).toUpperCase();
      const project = plv8.execute(`SELECT * FROM team_project_table WHERE team_project_id='${projectId}';`)[0];
      
      let endId = '';
      if(formName==='Quotation') {
        endId = `Q-${newCount}`;
      } else if(formName==='Sourced Item') {
        endId = `SI-${newCount}`;
      } else if(formName==='Receiving Inspecting Report') {
        endId = `RIR-${newCount}`;
      } else if(formName==='Release Order') {
        endId = `RO-${newCount}`;
      } else if(formName==='Transfer Receipt') {
        endId = `TR-${newCount}`;
      } else {
        endId = `-${newCount}`;
      }

      request_formsly_id = `${project.team_project_code}${endId}`;
    }
    
    if (projectId === "") {
      request_data = plv8.execute(`INSERT INTO request_table (request_id,request_form_id,request_team_member_id) VALUES ('${requestId}','${formId}','${teamMemberId}') RETURNING *;`)[0];
    } else {
      request_data = plv8.execute(`INSERT INTO request_table (request_id,request_form_id,request_team_member_id,request_formsly_id,request_project_id) VALUES ('${requestId}','${formId}','${teamMemberId}','${request_formsly_id}','${projectId}') RETURNING *;`)[0];
    }

    plv8.execute(`INSERT INTO request_response_table (request_response,request_response_duplicatable_section_id,request_response_field_id,request_response_request_id) VALUES ${responseValues};`);

    plv8.execute(`INSERT INTO request_signer_table (request_signer_signer_id,request_signer_request_id) VALUES ${signerValues};`);

    plv8.execute(`INSERT INTO notification_table (notification_app,notification_content,notification_redirect_url,notification_team_id,notification_type,notification_user_id) VALUES ${notificationValues};`);
    
 });
 return request_data;
$$ LANGUAGE plv8;

-- End: Create request

-- Start: Approve or reject request
    
CREATE OR REPLACE FUNCTION approve_or_reject_request(
    input_data JSON
)
RETURNS VOID AS $$
  plv8.subtransaction(function(){
    const {
      requestId,
      isPrimarySigner,
      requestSignerId,
      requestOwnerId,
      signerFullName,
      formName,
      requestAction,
      memberId,
      teamId,
    } = input_data;

    const present = { APPROVED: "APPROVE", REJECTED: "REJECT" };

    plv8.execute(`UPDATE request_signer_table SET request_signer_status = '${requestAction}' WHERE request_signer_signer_id='${requestSignerId}' AND request_signer_request_id='${requestId}';`);
    
    plv8.execute(`INSERT INTO comment_table (comment_request_id,comment_team_member_id,comment_type,comment_content) VALUES ('${requestId}','${memberId}','ACTION_${requestAction}','${signerFullName} ${requestAction.toLowerCase()}  this request');`);
    
    plv8.execute(`INSERT INTO notification_table (notification_app,notification_type,notification_content,notification_redirect_url,notification_user_id,notification_team_id) VALUES ('REQUEST','${present[requestAction]}','${signerFullName} ${requestAction.toLowerCase()} your ${formName} request','/team-requests/requests/${requestId}','${requestOwnerId}','${teamId}');`);
    
    if(isPrimarySigner===true){
      plv8.execute(`UPDATE request_table SET request_status = '${requestAction}' WHERE request_id='${requestId}';`);
    }
    
 });
$$ LANGUAGE plv8;

-- End: Approve or reject request

-- Start: Create formsly premade forms

CREATE OR REPLACE FUNCTION create_formsly_premade_forms(
    input_data JSON
)
RETURNS VOID AS $$
  plv8.subtransaction(function(){
    const {
      formValues,
      sectionValues,
      fieldWithIdValues,
      fieldsWithoutIdValues,
      optionsValues
    } = input_data;

    plv8.execute(`INSERT INTO form_table (form_id,form_name,form_description,form_app,form_is_formsly_form,form_is_hidden,form_team_member_id,form_is_disabled) VALUES ${formValues};`);
    
    plv8.execute(`INSERT INTO section_table (section_form_id,section_id,section_is_duplicatable,section_name,section_order) VALUES ${sectionValues};`);

    plv8.execute(`INSERT INTO field_table (field_id,field_is_read_only,field_is_required,field_name,field_order,field_section_id,field_type) VALUES ${fieldWithIdValues};`);

    plv8.execute(`INSERT INTO field_table (field_is_read_only,field_is_required,field_name,field_order,field_section_id,field_type) VALUES ${fieldsWithoutIdValues};`);

    plv8.execute(`INSERT INTO option_table (option_field_id,option_order,option_value) VALUES ${optionsValues};`);

 });
$$ LANGUAGE plv8;

-- End: Create formsly premade forms

-- Start: Create item

CREATE OR REPLACE FUNCTION create_item(
    input_data JSON
)
RETURNS JSON AS $$
  let item_data;
  plv8.subtransaction(function(){
    const {
      formId,
      itemData: {
        item_general_name,
        item_is_available,
        item_unit,
        item_gl_account,
        item_team_id,
        item_division_id
      },
      itemDescription
    } = input_data;

    
    const item_result = plv8.execute(`INSERT INTO item_table (item_general_name,item_is_available,item_unit,item_gl_account,item_team_id,item_division_id) VALUES ('${item_general_name}','${item_is_available}','${item_unit}','${item_gl_account}','${item_team_id}','${item_division_id}') RETURNING *;`)[0];

    const {section_id} = plv8.execute(`SELECT section_id FROM section_table WHERE section_form_id='${formId}' AND section_name='Item';`)[0];

    const itemDescriptionInput = [];
    const fieldInput= [];

    itemDescription.forEach((description) => {
      const fieldId = plv8.execute('SELECT uuid_generate_v4();')[0].uuid_generate_v4
      itemDescriptionInput.push({
        item_description_label: description,
        item_description_item_id: item_result.item_id,
        item_description_is_available: true,
        item_description_field_id: fieldId,
      });
      fieldInput.push({
        field_id: fieldId,
        field_name: description,
        field_type: "DROPDOWN",
        field_order: 14,
        field_section_id: section_id,
        field_is_required: true,
      });
    });

    const itemDescriptionValues = itemDescriptionInput
      .map((item) =>
        `('${item.item_description_label}','${item.item_description_item_id}','${item.item_description_is_available}','${item.item_description_field_id}')`
      )
      .join(",");

    const fieldValues = fieldInput
      .map((field) =>
        `('${field.field_id}','${field.field_name}','${field.field_type}','${field.field_order}','${field.field_section_id}','${field.field_is_required}')`
      )
      .join(",");

    plv8.execute(`INSERT INTO field_table (field_id,field_name,field_type,field_order,field_section_id,field_is_required) VALUES ${fieldValues};`);
    
    const item_description = plv8.execute(`INSERT INTO item_description_table (item_description_label,item_description_item_id,item_description_is_available,item_description_field_id) VALUES ${itemDescriptionValues} RETURNING *;`);

    item_data = {...item_result, item_description: item_description}

 });
 return item_data;
$$ LANGUAGE plv8;

-- End: Create item

-- Start: Create team invitation


CREATE OR REPLACE FUNCTION create_team_invitation(
    input_data JSON
)
RETURNS JSON AS $$
  let invitation_data;
  plv8.subtransaction(function(){
    const {
      emailList,
      teamMemberId,
      teamName
    } = input_data;

    const invitationInput = [];
    const notificationInput = [];

    emailList.forEach((email) => {
      const invitationId = plv8.execute('SELECT uuid_generate_v4()')[0].uuid_generate_v4;

      const  checkInvitationCount = plv8.execute(`SELECT COUNT(*) FROM invitation_table WHERE invitation_to_email='${email}' AND invitation_from_team_member_id='${teamMemberId}' AND invitation_is_disabled='false' AND invitation_status='PENDING';`)[0].count;
        
      if (!checkInvitationCount) {
        invitationInput.push({
          invitation_id: invitationId,
          invitation_to_email: email,
          invitation_from_team_member_id: teamMemberId,
        });
      }

      const checkUserData = plv8.execute(`SELECT * FROM user_table WHERE user_email='${email}';`)[0];

      if (checkUserData) {
        notificationInput.push({
          notification_app: "GENERAL",
          notification_content: `You have been invited to join ${teamName}`,
          notification_redirect_url: `/team/invitation/${invitationId}`,
          notification_type: "INVITE",
          notification_user_id: checkUserData.user_id,
        });
      }
    });

    if (invitationInput.length > 0){
      const invitationValues = invitationInput
        .map((invitation) =>
          `('${invitation.invitation_id}','${invitation.invitation_to_email}','${invitation.invitation_from_team_member_id}')`
        )
        .join(",");

      invitation_data = plv8.execute(`INSERT INTO invitation_table (invitation_id,invitation_to_email,invitation_from_team_member_id) VALUES ${invitationValues} RETURNING *;`);
    }

    if (notificationInput.length > 0){
      const notificationValues = notificationInput
        .map((notification) =>
          `('${notification.notification_app}','${notification.notification_content}','${notification.notification_redirect_url}','${notification.notification_type}','${notification.notification_user_id}')`
        )
        .join(",");

      plv8.execute(`INSERT INTO notification_table (notification_app,notification_content,notification_redirect_url,notification_type,notification_user_id) VALUES ${notificationValues};`);
    }
  });
  return invitation_data;
$$ LANGUAGE plv8;

-- End: Create team invitation

-- Start: Get user's active team id

CREATE OR REPLACE FUNCTION get_user_active_team_id(
    user_id TEXT
)
RETURNS TEXT as $$
  let active_team_id;
  plv8.subtransaction(function(){
    const user_data = plv8.execute(`SELECT * FROM user_table WHERE user_id='${user_id}' LIMIT 1`)[0];
    
    if(!user_data.user_active_team_id){
      const team_member = plv8.execute(`SELECT * FROM team_member_table WHERE team_member_user_id='${user_id}' AND team_member_is_disabled='false' LIMIT 1`)[0];
      if(team_member){
        active_team_id = team_member.team_member_team_id
      }
    }else{
      active_team_id = user_data.user_active_team_id
    }  
 });
 return active_team_id;
$$ LANGUAGE plv8;

-- End: Get user's active team id

-- Start: check if Requisition form can be activated

CREATE OR REPLACE FUNCTION check_requisition_form_status(
    team_id TEXT,
    form_id TEXT
)
RETURNS Text as $$
  let return_data;
  plv8.subtransaction(function(){


    const item_count = plv8.execute(`SELECT COUNT(*) FROM item_table WHERE item_team_id='${team_id}' AND item_is_available='true' AND item_is_disabled='false'`)[0];

    const signer_count = plv8.execute(`SELECT COUNT(*) FROM signer_table WHERE signer_form_id='${form_id}' AND signer_is_disabled='false' AND signer_is_primary_signer='true'`)[0];

    if (!item_count.count) {
      return_data = "There must be at least one available item";
    } else if (!signer_count) {
      return_data = "You need to add a primary signer first";
    } else {
      return_data = "true"
    }
 });

 return return_data;
$$ LANGUAGE plv8;

-- End: check if Requisition form can be activated

-- Start: Transfer ownership 

CREATE OR REPLACE FUNCTION transfer_ownership(
    owner_id TEXT,
    member_id TEXT
)
RETURNS VOID  as $$
  plv8.subtransaction(function(){

    plv8.execute(`UPDATE team_member_table SET team_member_role='OWNER' WHERE team_member_id='${member_id}'`);
    plv8.execute(`UPDATE team_member_table SET team_member_role='ADMIN' WHERE team_member_id='${owner_id}'`);
 });
$$ LANGUAGE plv8;

-- End: Transfer ownership

-- Start: Accept team invitation

CREATE OR REPLACE FUNCTION accept_team_invitation(
    invitation_id TEXT,
    team_id TEXT,
    user_id TEXT
)
RETURNS JSON as $$
  let user_team_list
  plv8.subtransaction(function(){

    const isUserPreviousMember = plv8.execute(`SELECT COUNT(*) FROM team_member_table WHERE team_member_team_id='${team_id}' AND team_member_user_id='${user_id}' AND team_member_is_disabled=TRUE`);
    const userData = plv8.execute(`SELECT user_id, user_active_team_id FROM user_table WHERE user_id='${user_id}'`)[0];

    if (isUserPreviousMember[0].count > 0) {
      plv8.execute(`UPDATE team_member_table SET team_member_is_disabled=FALSE WHERE team_member_team_id='${team_id}' AND team_member_user_id='${user_id}'`);
    } else {
      plv8.execute(`INSERT INTO team_member_table (team_member_team_id, team_member_user_id) VALUES ('${team_id}', '${user_id}')`);
    }

    if (!userData.user_active_team_id) {
      plv8.execute(`UPDATE user_table SET user_active_team_id='${team_id}' WHERE user_id='${user_id}'`);
    }

    plv8.execute(`UPDATE invitation_table SET invitation_status='ACCEPTED' WHERE invitation_id='${invitation_id}'`);

    user_team_list = plv8.execute(`SELECT tt.* 
      FROM team_member_table as tm
      JOIN team_table as tt ON tt.team_id = tm.team_member_team_id
      WHERE team_member_is_disabled=FALSE 
      AND team_member_user_id='${user_id}'
      ORDER BY tt.team_date_created DESC`)

 });
 return user_team_list;
$$ LANGUAGE plv8;

-- End: Accept team invitation

-- Start: Update request status to canceled

CREATE OR REPLACE FUNCTION cancel_request(
    request_id TEXT,
    member_id TEXT,
    comment_type TEXT,
    comment_content TEXT
)
RETURNS VOID as $$
  plv8.subtransaction(function(){

    plv8.execute(`UPDATE request_table SET request_status='CANCELED' WHERE request_id='${request_id}'`);
    plv8.execute(`INSERT INTO comment_table (comment_request_id,comment_team_member_id,comment_type,comment_content) VALUES ('${request_id}', '${member_id}','${comment_type}', '${comment_content}')`);
 });
$$ LANGUAGE plv8;

-- End: Accept team invitation

-- Start: Create request form

CREATE OR REPLACE FUNCTION create_request_form(
    input_data JSON
)
RETURNS JSON AS $$
  let form_data;
  plv8.subtransaction(function(){
    const {
      teamMemberId,
      formBuilderData: {
        formDescription,
        formId,
        formName,
        formType,
        groupList,
        isForEveryone,
        isSignatureRequired,
        sections,
        signers
      },
    } = input_data;

    form_data = plv8.execute(`INSERT INTO form_table (form_app,form_description,form_name,form_team_member_id,form_id,form_is_signature_required,form_is_for_every_member) VALUES ('${formType}','${formDescription}','${formName}','${teamMemberId}','${formId}','${isSignatureRequired}','${isForEveryone}') RETURNING *`)[0];

    const sectionInput = [];
    const fieldInput = [];
    const optionInput = [];

    sections.forEach((section) => {
      const { fields, ...newSection } = section;
      sectionInput.push(newSection);
      fields.forEach((field) => {
        const { options, ...newField } = field;
        fieldInput.push(newField);
        options.forEach((option) => optionInput.push(option));
      });
    });

    const sectionValues = sectionInput
      .map(
        (section) =>
          `('${section.section_id}','${formId}','${section.section_is_duplicatable}','${section.section_name}','${section.section_order}')`
      )
      .join(",");

    const fieldValues = fieldInput
      .map(
        (field) =>
          `('${field.field_id}','${field.field_name}','${field.field_type}',${
            field.field_description ? `'${field.field_description}'` : "NULL"
          },'${field.field_is_positive_metric}','${field.field_is_required}','${field.field_order}','${field.field_section_id}')`
      )
      .join(",");


    const optionValues = optionInput
      .map(
        (option) =>
          `('${option.option_id}','${option.option_value}',${
            option.option_description ? `'${option.option_description}'` : "NULL"
          },'${option.option_order}','${option.option_field_id}')`
      )
      .join(",");
    
    const signerValues = signers
      .map(
        (signer) =>
          `('${signer.signer_id}','${formId}','${signer.signer_team_member_id}','${signer.signer_action}','${signer.signer_is_primary_signer}','${signer.signer_order}')`
      )
      .join(",");

    const groupValues = groupList
      .map(
        (group) =>
          `('${formId}','${group}')`
      )
      .join(",");
    
    const section_query = `INSERT INTO section_table (section_id,section_form_id,section_is_duplicatable,section_name,section_order) VALUES ${sectionValues}`;

    const field_query = `INSERT INTO field_table (field_id,field_name,field_type,field_description,field_is_positive_metric,field_is_required,field_order,field_section_id) VALUES ${fieldValues}`;

    const option_query = `INSERT INTO option_table (option_id,option_value,option_description,option_order,option_field_id) VALUES ${optionValues}`;

    const signer_query = `INSERT INTO signer_table (signer_id,signer_form_id,signer_team_member_id,signer_action,signer_is_primary_signer,signer_order) VALUES ${signerValues}`;

    const form_group_query = `INSERT INTO form_team_group_table (form_id, team_group_id) VALUES ${groupValues}`;

    const all_query = `${section_query}; ${field_query}; ${optionInput.length>0?option_query:''}; ${signer_query}; ${groupList.length>0?form_group_query:''};`
    
    plv8.execute(all_query);
 });
 return form_data;
$$ LANGUAGE plv8;

-- End: Create request form

-- Start: Get all notification

CREATE OR REPLACE FUNCTION get_all_notification(
    input_data JSON
)
RETURNS JSON AS $$
  let notification_data;
  plv8.subtransaction(function(){
    const {
      userId,
      app,
      page,
      limit,
      teamId
    } = input_data;
    
    const start = (page - 1) * limit;

    let team_query = ''
    if(teamId) team_query = `OR notification_team_id='${teamId}'`

    const notification_list = plv8.execute(`SELECT  * FROM notification_table WHERE notification_user_id='${userId}' AND (notification_app = 'GENERAL' OR notification_app = '${app}') AND (notification_team_id IS NULL ${team_query}) ORDER BY notification_date_created DESC LIMIT '${limit}' OFFSET '${start}';`);
    
    const unread_notification_count = plv8.execute(`SELECT COUNT(*) FROM notification_table WHERE notification_user_id='${userId}' AND (notification_app='GENERAL' OR notification_app='${app}') AND (notification_team_id IS NULL ${team_query}) AND notification_is_read=false;`)[0].count;

    notification_data = {data: notification_list,  count: parseInt(unread_notification_count)}
 });
 return notification_data;
$$ LANGUAGE plv8;

-- End: Get all notification

-- Start: Update form signer

CREATE OR REPLACE FUNCTION update_form_signer(
    input_data JSON
)
RETURNS JSON AS $$
  let signer_data;
  plv8.subtransaction(function(){
    const {
     formId,
     signers,
     selectedProjectId
    } = input_data;

    plv8.execute(`UPDATE signer_table SET signer_is_disabled=true WHERE signer_form_id='${formId}' AND signer_team_project_id ${selectedProjectId ? `='${selectedProjectId}'` : "IS NULL"}`);

    const signerValues = signers
      .map(
        (signer) =>
          `('${signer.signer_id}','${formId}','${signer.signer_team_member_id}','${signer.signer_action}','${signer.signer_is_primary_signer}','${signer.signer_order}','${signer.signer_is_disabled}', ${selectedProjectId ? `'${selectedProjectId}'` : null})`
      )
      .join(",");

    signer_data = plv8.execute(`INSERT INTO signer_table (signer_id,signer_form_id,signer_team_member_id,signer_action,signer_is_primary_signer,signer_order,signer_is_disabled,signer_team_project_id) VALUES ${signerValues} ON CONFLICT ON CONSTRAINT signer_table_pkey DO UPDATE SET signer_team_member_id = excluded.signer_team_member_id, signer_action = excluded.signer_action, signer_is_primary_signer = excluded.signer_is_primary_signer, signer_order = excluded.signer_order, signer_is_disabled = excluded.signer_is_disabled, signer_team_project_id = excluded.signer_team_project_id RETURNING *;`);

 });
 return signer_data;
$$ LANGUAGE plv8;

-- End: Update form signer

-- Start: Check if the approving or creating quotation item quantity are less than the requisition quantity

CREATE OR REPLACE FUNCTION check_requisition_quantity(
    input_data JSON
)
RETURNS JSON AS $$
    let item_data
    plv8.subtransaction(function(){
        const {
        requisitionID,
        itemFieldList,
        quantityFieldList
        } = input_data;

        const request = plv8.execute(`SELECT request_response_table.* FROM request_response_table INNER JOIN request_table ON request_response_table.request_response_request_id = request_table.request_id AND request_table.request_status = 'APPROVED' AND request_table.request_form_id IS NOT NULL JOIN form_table ON request_table.request_form_id = form_table.form_id WHERE request_response_table.request_response = '${requisitionID}' AND form_table.form_is_formsly_form = true AND (form_table.form_name = 'Quotation' OR form_table.form_name = 'Sourced Item')`);
        
        let requestResponse = []
        if(request.length>0) {

            const requestIdList = request.map(
                (response) => `'${response.request_response_request_id}'`
            ).join(",");

            requestResponse = plv8.execute(`SELECT request_response_table.*, field_name FROM request_response_table INNER JOIN field_table ON field_id = request_response_field_id WHERE (field_name = 'Quantity' OR field_name = 'Item') AND request_response_request_id IN (${requestIdList});`);
        }

        const requestResponseItem = [];
        const requestResponseQuantity = [];

        requestResponse.forEach((response) => {
          if (response.field_name === "Item") {
            requestResponseItem.push(response);
          } else if (response.field_name === "Quantity") {
            requestResponseQuantity.push(response);
          }
        });

        requestResponseItem.push(...itemFieldList);
        requestResponseQuantity.push(...quantityFieldList);

        const itemList = [];
        const quantityList = [];

        for (let i = 0; i < requestResponseItem.length; i++) {
          if (itemList.includes(requestResponseItem[i].request_response)) {
            const quantityIndex = itemList.indexOf(
                requestResponseItem[i].request_response
            );
            quantityList[quantityIndex] += Number(
                requestResponseQuantity[i].request_response
            );
          } else {
            itemList.push(requestResponseItem[i].request_response);
            quantityList.push(Number(requestResponseQuantity[i].request_response));
          }
        }

        const returnData = [];
        const regExp = /\(([^)]+)\)/;
        for (let i = 0; i < itemList.length; i++) {
            const matches = regExp.exec(itemList[i]);
            if (!matches) continue;

            const quantityMatch = matches[1].match(/(\d+)/);
            if (!quantityMatch) continue;

            const expectedQuantity = Number(quantityMatch[1]);
            const unit = matches[1].replace(/\d+/g, "").trim();

            if (quantityList[i] > expectedQuantity) {
            const quantityMatch = itemList[i].match(/(\d+)/);
            if (!quantityMatch) return;

            returnData.push(
                `${JSON.parse(
                itemList[i].replace(
                    quantityMatch[1],
                    Number(quantityMatch[1]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                )
                )} exceeds quantity limit by ${(
                quantityList[i] - expectedQuantity
                ).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${unit}`
            );
            }
        }
        item_data = returnData;
    });
    return item_data;
$$ LANGUAGE plv8;

-- End: Check if the approving or creating quotation item quantity are less than the requisition quantity

-- Start: Check if the approving or creating release order item quantity are less than the quotation quantity

CREATE OR REPLACE FUNCTION check_ro_item_quantity(
    input_data JSON
)
RETURNS JSON AS $$
    let item_data
    plv8.subtransaction(function(){
        const {
        sourcedItemId,
        itemFieldId,
        quantityFieldId,
        itemFieldList,
        quantityFieldList
        } = input_data;

        const request = plv8.execute(`SELECT request_response_table.* FROM request_response_table JOIN request_table ON request_response_table.request_response_request_id = request_table.request_id AND request_table.request_status = 'APPROVED' AND request_table.request_form_id IS NOT NULL JOIN form_table ON request_table.request_form_id = form_table.form_id WHERE request_response_table.request_response = '${sourcedItemId}' AND form_table.form_is_formsly_form = true AND form_table.form_name = 'Release Order';`);
        
        let requestResponse = []
        if(request.length>0) {

            const requestIdList = request.map(
                (response) => `'${response.request_response_request_id}'`
            ).join(",");

            requestResponse = plv8.execute(`SELECT * FROM request_response_table WHERE (request_response_field_id = '${itemFieldId}' OR request_response_field_id = '${quantityFieldId}') AND request_response_request_id IN (${requestIdList});`);
        }

        const requestResponseItem = [];
        const requestResponseQuantity = [];

        requestResponse.forEach((response) => {
            if (response.request_response_field_id === itemFieldId) {
            requestResponseItem.push(response);
            } else if (response.request_response_field_id === quantityFieldId) {
            requestResponseQuantity.push(response);
            }
        });

        requestResponseItem.push(...itemFieldList);
        requestResponseQuantity.push(...quantityFieldList);

        const itemList = [];
        const quantityList = [];

        for (let i = 0; i < requestResponseItem.length; i++) {
            if (itemList.includes(requestResponseItem[i].request_response)) {
            const quantityIndex = itemList.indexOf(
                requestResponseItem[i].request_response
            );
            quantityList[quantityIndex] += Number(
                requestResponseQuantity[i].request_response
            );
            } else {
            itemList.push(requestResponseItem[i].request_response);
            quantityList.push(Number(requestResponseQuantity[i].request_response));
            }
        }

        const returnData = [];
        const regExp = /\(([^)]+)\)/;
        for (let i = 0; i < itemList.length; i++) {
            const matches = regExp.exec(itemList[i]);
            if (!matches) continue;

            const quantityMatch = matches[1].match(/(\d+)/);
            if (!quantityMatch) continue;

            const expectedQuantity = Number(quantityMatch[1]);
            const unit = matches[1].replace(/\d+/g, "").trim();

            if (quantityList[i] > expectedQuantity) {
            const quantityMatch = itemList[i].match(/(\d+)/);
            if (!quantityMatch) return;

            returnData.push(
                `${JSON.parse(
                itemList[i].replace(
                    quantityMatch[1],
                    Number(quantityMatch[1]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                )
                )} exceeds quantity limit by ${(
                quantityList[i] - expectedQuantity
                ).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${unit}`
            );
            }
        }
        item_data = returnData
    });
    return item_data;
$$ LANGUAGE plv8;

-- End: Check if the approving or creating release order item quantity are less than the quotation quantity

-- Start: Check if the approving or creating rir item quantity are less than the quotation quantity

CREATE OR REPLACE FUNCTION check_rir_item_quantity(
    input_data JSON
)
RETURNS JSON AS $$
    let item_data
    plv8.subtransaction(function(){
        const {
        quotationId,
        itemFieldId,
        quantityFieldId,
        itemFieldList,
        quantityFieldList
        } = input_data;

        const request = plv8.execute(`SELECT request_response_table.* FROM request_response_table JOIN request_table ON request_response_table.request_response_request_id = request_table.request_id AND request_table.request_status = 'APPROVED' AND request_table.request_form_id IS NOT NULL JOIN form_table ON request_table.request_form_id = form_table.form_id WHERE request_response_table.request_response = '${quotationId}' AND form_table.form_is_formsly_form = true AND form_table.form_name = 'Receiving Inspecting Report';`);
        
        let requestResponse = []
        if(request.length>0) {

            const requestIdList = request.map(
                (response) => `'${response.request_response_request_id}'`
            ).join(",");

            requestResponse = plv8.execute(`SELECT * FROM request_response_table WHERE (request_response_field_id = '${itemFieldId}' OR request_response_field_id = '${quantityFieldId}') AND request_response_request_id IN (${requestIdList});`);
        }

        const requestResponseItem = [];
        const requestResponseQuantity = [];

        requestResponse.forEach((response) => {
            if (response.request_response_field_id === itemFieldId) {
            requestResponseItem.push(response);
            } else if (response.request_response_field_id === quantityFieldId) {
            requestResponseQuantity.push(response);
            }
        });

        requestResponseItem.push(...itemFieldList);
        requestResponseQuantity.push(...quantityFieldList);

        const itemList = [];
        const quantityList = [];

        for (let i = 0; i < requestResponseItem.length; i++) {
            if (itemList.includes(requestResponseItem[i].request_response)) {
            const quantityIndex = itemList.indexOf(
                requestResponseItem[i].request_response
            );
            quantityList[quantityIndex] += Number(
                requestResponseQuantity[i].request_response
            );
            } else {
            itemList.push(requestResponseItem[i].request_response);
            quantityList.push(Number(requestResponseQuantity[i].request_response));
            }
        }

        const returnData = [];
        const regExp = /\(([^)]+)\)/;
        for (let i = 0; i < itemList.length; i++) {
            const matches = regExp.exec(itemList[i]);
            if (!matches) continue;

            const quantityMatch = matches[1].match(/(\d+)/);
            if (!quantityMatch) continue;

            const expectedQuantity = Number(quantityMatch[1]);
            const unit = matches[1].replace(/\d+/g, "").trim();

            if (quantityList[i] > expectedQuantity) {
            const quantityMatch = itemList[i].match(/(\d+)/);
            if (!quantityMatch) return;

            returnData.push(
                `${JSON.parse(
                itemList[i].replace(
                    quantityMatch[1],
                    Number(quantityMatch[1]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                )
                )} exceeds quantity limit by ${(
                quantityList[i] - expectedQuantity
                ).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${unit}`
            );
            }
        }
        item_data = returnData
    });
    return item_data;
$$ LANGUAGE plv8;

-- End: Check if the approving or creating tranfer receipt item quantity are less than the release order quantity

CREATE OR REPLACE FUNCTION check_tranfer_receipt_item_quantity(
    input_data JSON
)
RETURNS JSON AS $$
    let item_data
    plv8.subtransaction(function(){
        const {
        releaseOrderItemId,
        itemFieldId,
        quantityFieldId,
        itemFieldList,
        quantityFieldList
        } = input_data;

        const request = plv8.execute(`SELECT request_response_table.* FROM request_response_table JOIN request_table ON request_response_table.request_response_request_id = request_table.request_id AND request_table.request_status = 'APPROVED' AND request_table.request_form_id IS NOT NULL JOIN form_table ON request_table.request_form_id = form_table.form_id WHERE request_response_table.request_response = '${releaseOrderItemId}' AND form_table.form_is_formsly_form = true AND form_table.form_name = 'Transfer Receipt';`);
        
        let requestResponse = []
        if(request.length>0) {

            const requestIdList = request.map(
                (response) => `'${response.request_response_request_id}'`
            ).join(",");

            requestResponse = plv8.execute(`SELECT * FROM request_response_table WHERE (request_response_field_id = '${itemFieldId}' OR request_response_field_id = '${quantityFieldId}') AND request_response_request_id IN (${requestIdList});`);
        }

        const requestResponseItem = [];
        const requestResponseQuantity = [];

        requestResponse.forEach((response) => {
            if (response.request_response_field_id === itemFieldId) {
            requestResponseItem.push(response);
            } else if (response.request_response_field_id === quantityFieldId) {
            requestResponseQuantity.push(response);
            }
        });

        requestResponseItem.push(...itemFieldList);
        requestResponseQuantity.push(...quantityFieldList);

        const itemList = [];
        const quantityList = [];

        for (let i = 0; i < requestResponseItem.length; i++) {
            if (itemList.includes(requestResponseItem[i].request_response)) {
            const quantityIndex = itemList.indexOf(
                requestResponseItem[i].request_response
            );
            quantityList[quantityIndex] += Number(
                requestResponseQuantity[i].request_response
            );
            } else {
            itemList.push(requestResponseItem[i].request_response);
            quantityList.push(Number(requestResponseQuantity[i].request_response));
            }
        }

        const returnData = [];
        const regExp = /\(([^)]+)\)/;
        for (let i = 0; i < itemList.length; i++) {
            const matches = regExp.exec(itemList[i]);
            if (!matches) continue;

            const quantityMatch = matches[1].match(/(\d+)/);
            if (!quantityMatch) continue;

            const expectedQuantity = Number(quantityMatch[1]);
            const unit = matches[1].replace(/\d+/g, "").trim();

            if (quantityList[i] > expectedQuantity) {
            const quantityMatch = itemList[i].match(/(\d+)/);
            if (!quantityMatch) return;

            returnData.push(
                `${JSON.parse(
                itemList[i].replace(
                    quantityMatch[1],
                    Number(quantityMatch[1]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                )
                )} exceeds quantity limit by ${(
                quantityList[i] - expectedQuantity
                ).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${unit}`
            );
            }
        }
        item_data = returnData
    });
    return item_data;
$$ LANGUAGE plv8;

-- End: Check if the approving or creating tranfer receipt item quantity are less than the release order quantity

-- Start: Fetch request list

CREATE OR REPLACE FUNCTION fetch_request_list(
    input_data JSON
)
RETURNS JSON AS $$
    let return_value
    plv8.subtransaction(function(){
      const {
        teamId,
        page,
        limit,
        requestor,
        status,
        form,
        sort,
        search,
      } = input_data;

      const start = (page - 1) * limit;

      const request_list = plv8.execute(
        `
          SELECT 
            request_table.request_id, 
            request_table.request_formsly_id,
            request_date_created, 
            request_status,
            request_team_member_id,
            request_form_id
          FROM request_table
          INNER JOIN team_member_table ON request_table.request_team_member_id = team_member_table.team_member_id
          INNER JOIN form_table ON request_table.request_form_id = form_table.form_id
          WHERE team_member_table.team_member_team_id = '${teamId}'
          AND request_is_disabled = false
          AND form_table.form_is_disabled = false
          ${requestor}
          ${status}
          ${form}
          ${search}
          ORDER BY request_table.request_date_created ${sort} 
          OFFSET ${start} ROWS FETCH FIRST ${limit} ROWS ONLY
        `
      );

      const request_count = plv8.execute(
        `
          SELECT COUNT(*)
          FROM request_table
          INNER JOIN team_member_table ON request_table.request_team_member_id = team_member_table.team_member_id
          INNER JOIN form_table ON request_table.request_form_id = form_table.form_id
          WHERE team_member_table.team_member_team_id = '${teamId}'
          AND request_is_disabled = false
          AND form_table.form_is_disabled = false
          ${requestor}
          ${status}
          ${form}
          ${search}
        `
      )[0];

      const request_data = request_list.map(request => {
        const request_team_member = plv8.execute(
          `
            SELECT 
              team_member_table.team_member_team_id, 
              user_table.user_id,
              user_table.user_first_name,
              user_table.user_last_name,
              user_table.user_avatar
            FROM team_member_table
            INNER JOIN user_table ON team_member_table.team_member_user_id = user_table.user_id
            WHERE team_member_table.team_member_id = '${request.request_team_member_id}'
          `
        )[0];
        const request_form = plv8.execute(`SELECT form_id, form_name, form_description FROM form_table WHERE form_id = '${request.request_form_id}'`)[0];
        const request_signer = plv8.execute(
          `
            SELECT 
              request_signer_table.request_signer_id, 
              request_signer_table.request_signer_status, 
              signer_table.signer_is_primary_signer,
              user_table.user_id,
              user_table.user_first_name,
              user_table.user_last_name,
              user_table.user_avatar
            FROM request_signer_table
            INNER JOIN signer_table ON request_signer_table.request_signer_signer_id = signer_table.signer_id
            INNER JOIN team_member_table ON signer_table.signer_team_member_id = team_member_table.team_member_id
            INNER JOIN user_table ON team_member_table.team_member_user_id = user_table.user_id
            WHERE request_signer_table.request_signer_request_id = '${request.request_id}'
          `
        ).map(signer => {
          return {
            request_signer_id: signer.request_signer_id,
            request_signer_status: signer.request_signer_status,
            request_signer: {
              signer_is_primary_signer: signer.signer_is_primary_signer ,
              signer_team_member: {
                team_member_user: {
                  user_id: signer.user_id,
                  user_first_name: signer.user_first_name,
                  user_last_name: signer.user_last_name,
                  user_avatar: signer.user_avatar,
                }
              }
            }
          }
        });

        return {
          request_id: request.request_id, 
          request_formsly_id: request.request_formsly_id,
          request_date_created: request.request_date_created, 
          request_status: request.request_status, 
          request_team_member: {
            team_member_team_id: request.request_team_member_id,
            team_member_user: {
              user_id: request_team_member.user_id, 
              user_first_name: request_team_member.user_first_name,
              user_last_name: request_team_member.user_last_name,
              user_avatar: request_team_member.user_avatar,
            },
          }, 
          request_form: {
            form_id: request_form.form_id,
            form_name: request_form.form_name,
            form_description: request_form.form_description,
            form_is_disabled: request_form.form_is_disabled,
          }, 
          request_signer: request_signer,
        }
      });

      return_value = {
        data: request_data, 
        count: Number(request_count.count)
      };
    });
    return return_value
$$ LANGUAGE plv8;

-- End: Fetch request list

-- Start: Approve sourced requisition request

CREATE OR REPLACE FUNCTION approve_sourced_requisition_request(
    input_data JSON
)
RETURNS VOID AS $$
  plv8.subtransaction(function(){
    const {
      approveOrRejectParameters,
      teamId,
      responseData,
      itemWithDupId,
      requisitionID
    } = input_data;

    plv8.execute(`
        select approve_or_reject_request('{
            "requestAction": "${approveOrRejectParameters.requestAction}",
            "requestId": "${approveOrRejectParameters.requestId}",
            "isPrimarySigner": ${approveOrRejectParameters.isPrimarySigner},
            "requestSignerId": "${approveOrRejectParameters.requestSignerId}",
            "requestOwnerId": "${approveOrRejectParameters.requestOwnerId}",
            "signerFullName": "${approveOrRejectParameters.signerFullName}",
            "formName": "${approveOrRejectParameters.formName}",
            "memberId": "${approveOrRejectParameters.memberId}",
            "teamId": "${approveOrRejectParameters.teamId}",
        }');
    `);

    const form = plv8.execute(
      `
        SELECT field_table.field_id FROM form_table 
        INNER JOIN team_member_table ON form_table.form_team_member_id = team_member_table.team_member_id
        INNER JOIN section_table ON form_table.form_id = section_table.section_form_id
        INNER JOIN field_table ON section_table.section_id = field_table.field_section_id
        WHERE form_table.form_name='Requisition'
        AND team_member_table.team_member_team_id='${teamId}'
        AND section_table.section_name='Item'
        AND field_table.field_name='Source Project'
      `
    )[0];

    const parsedData = JSON.parse(responseData);

    const inputData = parsedData.sections.map((section) => `('"${section.section_field[2].field_response}"', '${form.field_id}', ${itemWithDupId[`${section.section_field[0].field_response}`] ? `'${itemWithDupId[`${section.section_field[0].field_response}`]}'` : null}, '${requisitionID}')`).join(",");
    plv8.execute(`INSERT INTO request_response_table (request_response, request_response_field_id, request_response_duplicatable_section_id, request_response_request_id) VALUES ${inputData}`);

  });
$$ LANGUAGE plv8;

-- End: Check if the approving or creating rir item quantity are less than the quotation quantity


-- Start: Create Team Project
CREATE OR REPLACE FUNCTION create_team_project(
    input_data JSON
)
RETURNS JSON AS $$
  let team_project_data;
  plv8.subtransaction(function(){
    const {
    teamProjectName,
    teamProjectInitials,
    teamProjectTeamId,
    } = input_data;

    
   const projectInitialCount = plv8.execute(`
      SELECT COUNT(*) FROM team_project_table 
      WHERE team_project_team_id = $1 
      AND team_project_code ILIKE '%' || $2 || '%';
    `, [teamProjectTeamId, teamProjectInitials])[0].count + 1n;

    const teamProjectCode = teamProjectInitials + projectInitialCount.toString(36).toUpperCase();

    team_project_data = plv8.execute(`INSERT INTO team_project_table (team_project_name, team_project_code, team_project_team_id) VALUES ('${teamProjectName}', '${teamProjectCode}', '${teamProjectTeamId}') RETURNING *;`)[0];

 });
 return team_project_data;
$$ LANGUAGE plv8;
-- End: Create Team Project

-- Start: Insert Group Member

CREATE OR REPLACE FUNCTION insert_group_member(
    input_data JSON
)
RETURNS JSON AS $$
  let group_data;
  plv8.subtransaction(function(){
    const {
     groupId,
     teamMemberIdList
    } = input_data;

    const teamMemberIdListValues = teamMemberIdList.map(memberId=>`'${memberId}'`).join(",");

    const alreadyMemberData = plv8.execute(`SELECT team_member_id FROM team_group_member_table WHERE team_group_id='${groupId}' AND team_member_id IN (${teamMemberIdListValues});`);

    const alreadyMemberId = alreadyMemberData.map(
      (member) => member.team_member_id
    );

    const insertData = [];
    teamMemberIdList.forEach((memberId) => {
      if (!alreadyMemberId.includes(memberId)) {
        insertData.push({
          team_group_id: groupId,
          team_member_id: memberId,
        });
      }
    });

    const groupMemberValues = insertData
      .map(
        (member) =>
          `('${member.team_member_id}','${member.team_group_id}')`
      )
      .join(",");

    const groupInsertData = plv8.execute(`INSERT INTO team_group_member_table (team_member_id,team_group_id) VALUES ${groupMemberValues} RETURNING *;`);

    const groupInsertValues = groupInsertData.map(group=>`('${group.team_group_member_id}','${group.team_member_id}','${group.team_group_id}')`).join(",");

    const groupJoin = plv8.execute(`SELECT tgm.team_group_member_id, json_build_object( 'team_member_id', tmemt.team_member_id, 'team_member_date_created', tmemt.team_member_date_created, 'team_member_user', ( SELECT json_build_object( 'user_id', usert.user_id, 'user_first_name', usert.user_first_name, 'user_last_name', usert.user_last_name, 'user_avatar', usert.user_avatar, 'user_email', usert.user_email ) FROM user_table usert WHERE usert.user_id = tmemt.team_member_user_id ) ) AS team_member FROM team_group_member_table tgm LEFT JOIN team_member_table tmemt ON tgm.team_member_id = tmemt.team_member_id WHERE (tgm.team_group_member_id,tgm.team_member_id,tgm.team_group_id) IN (${groupInsertValues}) GROUP BY tgm.team_group_member_id ,tmemt.team_member_id;`);

    group_data = {data: groupJoin, count: groupJoin.length};

 });
 return group_data;
$$ LANGUAGE plv8;

-- End: Insert Group Member

-- Start: Insert Project Member

CREATE OR REPLACE FUNCTION insert_project_member(
    input_data JSON
)
RETURNS JSON AS $$
  let project_data;
  plv8.subtransaction(function(){
    const {
     projectId,
     teamMemberIdList
    } = input_data;

    const teamMemberIdListValues = teamMemberIdList.map(memberId=>`'${memberId}'`).join(",")

    const alreadyMemberData = plv8.execute(`SELECT team_member_id FROM team_project_member_table WHERE team_project_id='${projectId}' AND team_member_id IN (${teamMemberIdListValues});`);

    const alreadyMemberId = alreadyMemberData.map(
      (member) => member.team_member_id
    );

    const insertData = [];
    teamMemberIdList.forEach((memberId) => {
      if (!alreadyMemberId.includes(memberId)) {
        insertData.push({
          team_project_id: projectId,
          team_member_id: memberId,
        });
      }
    });

    const projectMemberValues = insertData
      .map(
        (member) =>
          `('${member.team_member_id}','${member.team_project_id}')`
      )
      .join(",");

    const projectInsertData = plv8.execute(`INSERT INTO team_project_member_table (team_member_id,team_project_id) VALUES ${projectMemberValues} RETURNING *;`);

    const projectInsertValues = projectInsertData.map(project=>`('${project.team_project_member_id}','${project.team_member_id}','${project.team_project_id}')`).join(",")

    const projectJoin = plv8.execute(`SELECT tpm.team_project_member_id, json_build_object( 'team_member_id', tmemt.team_member_id, 'team_member_date_created', tmemt.team_member_date_created, 'team_member_user', ( SELECT json_build_object( 'user_id', usert.user_id, 'user_first_name', usert.user_first_name, 'user_last_name', usert.user_last_name, 'user_avatar', usert.user_avatar, 'user_email', usert.user_email ) FROM user_table usert WHERE usert.user_id = tmemt.team_member_user_id ) ) AS team_member FROM team_project_member_table tpm LEFT JOIN team_member_table tmemt ON tpm.team_member_id = tmemt.team_member_id WHERE (tpm.team_project_member_id,tpm.team_member_id,tpm.team_project_id) IN (${projectInsertValues}) GROUP BY tpm.team_project_member_id ,tmemt.team_member_id;`) 

    project_data = {data: projectJoin, count: projectJoin.length};

 });
 return project_data;
$$ LANGUAGE plv8;

-- End: Insert Project Member

-- Start: Update Form Group

CREATE OR REPLACE FUNCTION update_form_group(
    input_data JSON
)
RETURNS VOID AS $$
  plv8.subtransaction(function(){
    const {
     formId,
     isForEveryone,
     groupList
    } = input_data;

    plv8.execute(`UPDATE form_table SET form_is_for_every_member='${isForEveryone?"TRUE":"FALSE"}' WHERE form_id='${formId}';`);

    plv8.execute(`DELETE FROM form_team_group_table WHERE form_id='${formId}';`);

    const newGroupInsertValues = groupList.map((group) =>`('${group}','${formId}')`).join(",");
    
    plv8.execute(`INSERT INTO form_team_group_table (team_group_id,form_id) VALUES ${newGroupInsertValues} RETURNING *;`);
  });
$$ LANGUAGE plv8;

-- End: Update Form Group

-- Start: Get all team members without existing member of the group

CREATE OR REPLACE FUNCTION get_all_team_members_without_group_members(
    input_data JSON
)
RETURNS JSON AS $$
  let member_data;
  plv8.subtransaction(function(){
    const {
     teamId,
     groupId
    } = input_data;

    const teamGroupMemberData = plv8.execute(`SELECT team_member_id FROM team_group_member_table where team_group_id='${groupId}';`);

    const condition = teamGroupMemberData.map((member) => `'${member.team_member_id}'`).join(",");

    let teamMemberList = [];
    
    if(condition.length !== 0){
      teamMemberList = plv8.execute(`SELECT tmt.team_member_id, ( SELECT json_build_object( 'user_id', usert.user_id, 'user_first_name', usert.user_first_name, 'user_last_name', usert.user_last_name, 'user_avatar', usert.user_avatar, 'user_email', usert.user_email ) FROM user_table usert WHERE usert.user_id = tmt.team_member_user_id AND usert.user_is_disabled = FALSE ) AS team_member_user FROM team_member_table tmt WHERE tmt.team_member_team_id = '${teamId}' AND tmt.team_member_is_disabled = FALSE AND tmt.team_member_id NOT IN (${condition})`);
    }else{
      teamMemberList = plv8.execute(`SELECT tmt.team_member_id, ( SELECT json_build_object( 'user_id', usert.user_id, 'user_first_name', usert.user_first_name, 'user_last_name', usert.user_last_name, 'user_avatar', usert.user_avatar, 'user_email', usert.user_email ) FROM user_table usert WHERE usert.user_id = tmt.team_member_user_id AND usert.user_is_disabled = FALSE ) AS team_member_user FROM team_member_table tmt WHERE tmt.team_member_team_id = '${teamId}' AND tmt.team_member_is_disabled = FALSE`);
    }

    member_data = teamMemberList.sort((a, b) =>
      a.user_first_name < b.user_first_name ? -1 : (a.user_first_name > b.user_first_name ? 1 : 0)
    )
 });
 return member_data;
$$ LANGUAGE plv8;

-- End: Get all team members without existing member of the group

-- End: Get all team members without existing member of the project

CREATE OR REPLACE FUNCTION get_all_team_members_without_project_members(
    input_data JSON
)
RETURNS JSON AS $$
  let member_data;
  plv8.subtransaction(function(){
    const {
     teamId,
     projectId
    } = input_data;

    const teamProjectMemberData = plv8.execute(`SELECT team_member_id FROM team_project_member_table where team_project_id='${projectId}';`);

    const condition = teamProjectMemberData.map((member) => `'${member.team_member_id}'`).join(",");

    let teamMemberList = []
    
    if(condition.length !== 0){
      teamMemberList = plv8.execute(`SELECT tmt.team_member_id, ( SELECT json_build_object( 'user_id', usert.user_id, 'user_first_name', usert.user_first_name, 'user_last_name', usert.user_last_name, 'user_avatar', usert.user_avatar, 'user_email', usert.user_email ) FROM user_table usert WHERE usert.user_id = tmt.team_member_user_id AND usert.user_is_disabled = FALSE ) AS team_member_user FROM team_member_table tmt WHERE tmt.team_member_team_id = '${teamId}' AND tmt.team_member_is_disabled = FALSE AND tmt.team_member_id NOT IN (${condition});`);
    }else{
      teamMemberList = plv8.execute(`SELECT tmt.team_member_id, ( SELECT json_build_object( 'user_id', usert.user_id, 'user_first_name', usert.user_first_name, 'user_last_name', usert.user_last_name, 'user_avatar', usert.user_avatar, 'user_email', usert.user_email ) FROM user_table usert WHERE usert.user_id = tmt.team_member_user_id AND usert.user_is_disabled = FALSE ) AS team_member_user FROM team_member_table tmt WHERE tmt.team_member_team_id = '${teamId}' AND tmt.team_member_is_disabled = FALSE`);
    }

    member_data = teamMemberList.sort((a, b) =>
      a.user_first_name < b.user_first_name ? -1 : (a.user_first_name > b.user_first_name ? 1 : 0)
    )

 });
 return member_data;
$$ LANGUAGE plv8;

-- End: Get all team members without existing member of the project

-- Start: Delete team

CREATE OR REPLACE FUNCTION delete_team(
    team_id TEXT,
    team_member_id TEXT
)
RETURNS VOID as $$
  plv8.subtransaction(function(){
    const user = plv8.execute(`SELECT * FROM team_member_table WHERE team_member_team_id='${team_id}' AND team_member_id='${team_member_id}'`)[0];
    const isUserOwner = user.team_member_role === 'OWNER';

    if (!isUserOwner) return;


    plv8.execute(`UPDATE team_table SET team_is_disabled=TRUE WHERE team_id='${team_id}'`);

    plv8.execute(`UPDATE team_member_table SET team_member_is_disabled=TRUE WHERE team_member_team_id='${team_id}'`);

    plv8.execute(`UPDATE invitation_table it
      SET invitation_is_disabled=TRUE
      FROM team_member_table tm
      WHERE tm.team_member_team_id='${team_id}'
      AND tm.team_member_id = it.invitation_from_team_member_id `);

    plv8.execute(`UPDATE form_table ft
      SET form_is_disabled=TRUE
      FROM team_member_table tm
      WHERE tm.team_member_team_id='${team_id}'
      AND tm.team_member_id = ft.form_team_member_id `);

    plv8.execute(`UPDATE request_table rt
      SET request_is_disabled=TRUE
      FROM team_member_table tm
      WHERE tm.team_member_team_id='${team_id}'
      AND tm.team_member_id = rt.request_team_member_id `);

    plv8.execute(`UPDATE signer_table st
      SET signer_is_disabled=TRUE
      FROM team_member_table tm
      WHERE tm.team_member_team_id='${team_id}'
      AND tm.team_member_id = st.signer_team_member_id `);

    plv8.execute(`UPDATE comment_table ct
      SET comment_is_disabled=TRUE
      FROM team_member_table tm
      WHERE tm.team_member_team_id='${team_id}'
      AND tm.team_member_id = ct.comment_team_member_id `);

    plv8.execute(`UPDATE team_group_table SET team_group_is_disabled=TRUE WHERE team_group_team_id='${team_id}'`);

    plv8.execute(`UPDATE team_project_table SET team_project_is_disabled=TRUE WHERE team_project_team_id='${team_id}'`);

    plv8.execute(`UPDATE item_table SET item_is_disabled=TRUE, item_is_available=FALSE WHERE item_team_id='${team_id}'`);

    plv8.execute(`UPDATE item_description_table dt
      SET item_description_is_disabled=TRUE, item_description_is_available=FALSE
      FROM item_table it
      WHERE it.item_team_id='${team_id}'
      AND dt.item_description_item_id = it.item_id `);

    plv8.execute(`UPDATE item_description_field_table AS idf
      SET item_description_field_is_disabled=TRUE, item_description_field_is_available=FALSE
      FROM item_description_table AS dt
      JOIN item_table AS it ON it.item_id = dt.item_description_item_id
      WHERE dt.item_description_id = idf.item_description_field_item_description_id
      AND it.item_team_id = '${team_id}'
      AND dt.item_description_item_id = it.item_id`);

    const userTeamList = plv8.execute(`SELECT * FROM team_member_table WHERE team_member_id='${team_member_id}' AND team_member_is_disabled=FALSE`);

    if (userTeamList.length > 0) {
      plv8.execute(`UPDATE user_table SET user_active_team_id='${userTeamList[0].team_member_team_id}' WHERE user_id='${user.team_member_user_id}'`);
    } else {
      plv8.execute(`UPDATE user_table SET user_active_team_id=NULL WHERE user_id='${user.team_member_user_id}'`);
    }
 });
$$ LANGUAGE plv8;

-- END: Delete team


---------- End: FUNCTIONS


-------- Start: POLICIES
ALTER TABLE attachment_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_description_field_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_description_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_signer_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE signer_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_response_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_team_group_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_group_member_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_group_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_project_member_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_project_table ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Allow CRUD for authenticated users only" ON attachment_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON team_member_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON team_member_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON team_member_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON team_member_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON field_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON field_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON field_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON field_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON form_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON form_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON form_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON form_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON item_description_field_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON item_description_field_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON item_description_field_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON item_description_field_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON item_description_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON item_description_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON item_description_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON item_description_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON item_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON item_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON item_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON item_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON option_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON option_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON option_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON option_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON request_signer_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON request_signer_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON request_signer_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON request_signer_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON section_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON section_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON section_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON section_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON signer_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON signer_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON signer_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON signer_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users with OWNER or ADMIN role" ON supplier_table;
DROP POLICY IF EXISTS "Allow READ access for authenticated users" ON supplier_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON supplier_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users with OWNER or ADMIN role" ON supplier_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON comment_table;
DROP POLICY IF EXISTS "Allow READ for authenticated users" ON comment_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users based on team_member_id" ON comment_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users based on team_member_id" ON comment_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON invitation_table;
DROP POLICY IF EXISTS "Allow READ for users based on invitation_to_email" ON invitation_table;
DROP POLICY IF EXISTS "Allow UPDATE for users based on invitation_from_team_member_id" ON invitation_table;
DROP POLICY IF EXISTS "Allow DELETE for users based on invitation_from_team_member_id" ON invitation_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON notification_table;
DROP POLICY IF EXISTS "Allow READ for authenticated users on own notifications" ON notification_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users on own notifications" ON notification_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users on own notifications" ON notification_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON request_response_table;
DROP POLICY IF EXISTS "Allow READ for authenticated users" ON request_response_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users on own requests" ON request_response_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users on own requests" ON request_response_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON request_table;
DROP POLICY IF EXISTS "Allow READ for authenticated users" ON request_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users on own requests" ON request_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users on own requests" ON request_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON team_table;
DROP POLICY IF EXISTS "Allow READ for authenticated users" ON team_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users on own teams" ON team_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users on own teams" ON team_table;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON user_table;
DROP POLICY IF EXISTS "Allow READ for authenticated users" ON user_table;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users based on user_id" ON user_table;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users based on user_id" ON user_table;

DROP POLICY IF EXISTS "Allow CREATE for OWNER or ADMIN roles" ON form_team_group_table;
DROP POLICY IF EXISTS "Allow READ for authenticated team members" ON form_team_group_table;
DROP POLICY IF EXISTS "Allow UPDATE for OWNER or ADMIN roles" ON form_team_group_table;
DROP POLICY IF EXISTS "Allow DELETE for OWNER or ADMIN roles" ON form_team_group_table;

DROP POLICY IF EXISTS "Allow CREATE for OWNER or ADMIN roles" ON team_group_member_table;
DROP POLICY IF EXISTS "Allow READ for authenticated team members" ON team_group_member_table;
DROP POLICY IF EXISTS "Allow UPDATE for OWNER or ADMIN roles" ON team_group_member_table;
DROP POLICY IF EXISTS "Allow DELETE for OWNER or ADMIN roles" ON team_group_member_table;

DROP POLICY IF EXISTS "Allow CREATE for OWNER or ADMIN roles" ON team_group_table;
DROP POLICY IF EXISTS "Allow READ for authenticated team members" ON team_group_table;
DROP POLICY IF EXISTS "Allow UPDATE for OWNER or ADMIN roles" ON team_group_table;
DROP POLICY IF EXISTS "Allow DELETE for OWNER or ADMIN roles" ON team_group_table;

DROP POLICY IF EXISTS "Allow CREATE for OWNER or ADMIN roles" ON team_project_member_table;
DROP POLICY IF EXISTS "Allow READ for authenticated team members" ON team_project_member_table;
DROP POLICY IF EXISTS "Allow UPDATE for OWNER or ADMIN roles" ON team_project_member_table;
DROP POLICY IF EXISTS "Allow DELETE for OWNER or ADMIN roles" ON team_project_member_table;

DROP POLICY IF EXISTS "Allow CREATE for OWNER or ADMIN roles" ON team_project_table;
DROP POLICY IF EXISTS "Allow READ for authenticated team members" ON team_project_table;
DROP POLICY IF EXISTS "Allow UPDATE for OWNER or ADMIN roles" ON team_project_table;
DROP POLICY IF EXISTS "Allow DELETE for OWNER or ADMIN roles" ON team_project_table;

--- ATTACHMENT_TABLE
CREATE POLICY "Allow CRUD for authenticated users only" ON "public"."attachment_table"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true);

--- FIELD_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."field_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT tt.team_member_team_id
    FROM section_table AS st
    JOIN form_table AS fot ON st.section_form_id = fot.form_id
    JOIN team_member_table AS tt ON fot.form_team_member_id = tt.team_member_id
    WHERE st.section_id = field_section_id
  ) IN (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."field_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."field_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ( 
  (
    SELECT tt.team_member_team_id
    FROM section_table AS st
    JOIN form_table AS fot ON st.section_form_id = fot.form_id
    JOIN team_member_table AS tt ON fot.form_team_member_id = tt.team_member_id
    WHERE st.section_id = field_section_id
  ) IN (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."field_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING ( 
  (
    SELECT tt.team_member_team_id
    FROM section_table AS st
    JOIN form_table AS fot ON st.section_form_id = fot.form_id
    JOIN team_member_table AS tt ON fot.form_team_member_id = tt.team_member_id
    WHERE st.section_id = field_section_id
  ) IN (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- FORM_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."form_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ( 
  (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_id = form_team_member_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid() 
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."form_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."form_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_id = form_team_member_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid() 
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."form_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_id = form_team_member_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid() 
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- ITEM_DESCRIPTION_FIELD_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."item_description_field_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM item_description_table as id
    JOIN item_table as it ON it.item_id = id.item_description_item_id
    JOIN team_table as tt ON tt.team_id = it.item_team_id
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_id
    WHERE id.item_description_id = item_description_field_item_description_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."item_description_field_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."item_description_field_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM item_description_table as id
    JOIN item_table as it ON it.item_id = id.item_description_item_id
    JOIN team_table as tt ON tt.team_id = it.item_team_id
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_id
    WHERE id.item_description_id = item_description_field_item_description_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."item_description_field_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM item_description_table as id
    JOIN item_table as it ON it.item_id = id.item_description_item_id
    JOIN team_table as tt ON tt.team_id = it.item_team_id
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_id
    WHERE id.item_description_id = item_description_field_item_description_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- ITEM_DESCRIPTION_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."item_description_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM item_table as it
    JOIN team_table as tt ON tt.team_id = it.item_team_id
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_id
    WHERE it.item_id = item_description_item_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."item_description_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."item_description_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM item_table as it
    JOIN team_table as tt ON tt.team_id = it.item_team_id
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_id
    WHERE it.item_id = item_description_item_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."item_description_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM item_table as it
    JOIN team_table as tt ON tt.team_id = it.item_team_id
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_id
    WHERE it.item_id = item_description_item_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- ITEM_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."item_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM team_member_table
    WHERE team_member_team_id = item_team_id
    AND team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."item_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."item_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_member_table
    WHERE team_member_team_id = item_team_id
    AND team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."item_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM team_member_table
    WHERE team_member_team_id = item_team_id
    AND team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- OPTION_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."option_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM field_table as ft
    JOIN section_table as st ON st.section_id = ft.field_section_id
    JOIN form_table as fo ON fo.form_id = st.section_form_id
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id 
    WHERE ft.field_id = option_field_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."option_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."option_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM field_table as ft
    JOIN section_table as st ON st.section_id = ft.field_section_id
    JOIN form_table as fo ON fo.form_id = st.section_form_id
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id 
    WHERE ft.field_id = option_field_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."option_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM field_table as ft
    JOIN section_table as st ON st.section_id = ft.field_section_id
    JOIN form_table as fo ON fo.form_id = st.section_form_id
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id 
    WHERE ft.field_id = option_field_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- REQUEST_SIGNER_TABLE
CREATE POLICY "Allow CREATE for authenticated users" ON "public"."request_signer_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT tm.team_member_team_id
    FROM request_table as rt
    JOIN team_member_table as tm ON tm.team_member_id = rt.request_team_member_id
    WHERE rt.request_id = request_signer_request_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."request_signer_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."request_signer_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (
    SELECT tm.team_member_team_id
    FROM request_table as rt
    JOIN team_member_table as tm ON tm.team_member_id = rt.request_team_member_id
    WHERE rt.request_id = request_signer_request_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid() 
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."request_signer_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (
    SELECT tm.team_member_team_id
    FROM request_table as rt
    JOIN team_member_table as tm ON tm.team_member_id = rt.request_team_member_id
    WHERE rt.request_id = request_signer_request_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid() 
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- SECTION_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."section_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT tm.team_member_team_id
    FROM form_table as fo
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id
    WHERE fo.form_id = section_form_id
  ) IN (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."section_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."section_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (
    SELECT tm.team_member_team_id
    FROM form_table as fo
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id
    WHERE fo.form_id = section_form_id
  ) = (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."section_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (
    SELECT tm.team_member_team_id
    FROM form_table as fo
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id
    WHERE fo.form_id = section_form_id
  ) = (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- SIGNER_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."signer_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT tm.team_member_team_id
    FROM form_table as fo
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id
    WHERE fo.form_id = signer_form_id
  ) IN (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."signer_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."signer_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (
    SELECT tm.team_member_team_id
    FROM form_table as fo
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id
    WHERE fo.form_id = signer_form_id
  ) IN (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."signer_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (
    SELECT tm.team_member_team_id
    FROM form_table as fo
    JOIN team_member_table as tm ON tm.team_member_id = fo.form_team_member_id
    WHERE fo.form_id = signer_form_id
  ) IN (
    SELECT team_member_team_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- SUPPLIER_TABLE
CREATE POLICY "Allow CREATE for authenticated users with OWNER or ADMIN role" ON "public"."supplier_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  supplier_team_id IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."supplier_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."supplier_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  supplier_team_id IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."supplier_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  supplier_team_id IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

--- TEAM_MEMBER_TABLE
CREATE POLICY "Allow CREATE for authenticated users" ON "public"."team_member_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ access for authenticated users" ON "public"."team_member_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users with OWNER or ADMIN role" ON "public"."team_member_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  team_member_team_id IN (
    SELECT team_member_team_id from team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role = 'OWNER'
  ) OR team_member_user_id = auth.uid()
);

CREATE POLICY "Allow DELETE for authenticated users with OWNER or ADMIN role" ON "public"."team_member_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  team_member_team_id IN (
    SELECT team_member_team_id from team_member_table
    WHERE team_member_user_id = auth.uid()
    AND team_member_role = 'OWNER'
  )
);

--- COMMENT_TABLE
CREATE POLICY "Allow CREATE for authenticated users" ON "public"."comment_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ for authenticated users" ON "public"."comment_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users based on team_member_id" ON "public"."comment_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (comment_team_member_id IN (SELECT team_member_id FROM team_member_table WHERE team_member_user_id = auth.uid()))
WITH CHECK (comment_team_member_id IN (SELECT team_member_id FROM team_member_table WHERE team_member_user_id = auth.uid()));

CREATE POLICY "Allow DELETE for authenticated users based on team_member_id" ON "public"."comment_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (comment_team_member_id IN (SELECT team_member_id FROM team_member_table WHERE team_member_user_id = auth.uid()));

--- INVITATION_TABLE
CREATE POLICY "Allow CREATE for authenticated users" ON "public"."invitation_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ for users based on invitation_to_email" ON "public"."invitation_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (invitation_to_email = (SELECT user_email FROM user_table WHERE user_id = auth.uid()) OR invitation_from_team_member_id IN (SELECT team_member_id FROM team_member_table WHERE team_member_user_id = auth.uid()));

CREATE POLICY "Allow UPDATE for users based on invitation_from_team_member_id" ON "public"."invitation_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  invitation_from_team_member_id IN (
    SELECT team_member_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
  ) OR invitation_to_email = (
    SELECT user_email 
    FROM user_table 
    WHERE user_id = auth.uid()
  )
)

WITH CHECK (
  invitation_from_team_member_id IN (
    SELECT team_member_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
  ) OR invitation_to_email = (
    SELECT user_email 
    FROM user_table 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow DELETE for users based on invitation_from_team_member_id" ON "public"."invitation_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (invitation_from_team_member_id IN (SELECT team_member_id FROM team_member_table WHERE team_member_user_id = auth.uid()));

--- NOTIFICATION_TABLE
CREATE POLICY "Allow INSERT for authenticated users" ON "public"."notification_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ for authenticated users on own notifications" ON "public"."notification_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = notification_user_id);

CREATE POLICY "Allow UPDATE for authenticated users on notification_user_id" ON "public"."notification_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = notification_user_id)
WITH CHECK (auth.uid() = notification_user_id);

CREATE POLICY "Allow DELETE for authenticated users on notification_user_id" ON "public"."notification_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = notification_user_id);

--- REQUEST_RESPONSE_TABLE
CREATE POLICY "Allow CREATE access for all users" ON "public"."request_response_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ for authenticated users" ON "public"."request_response_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users on own request response"
ON "public"."request_response_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  (
    SELECT rt.request_team_member_id
    FROM request_table as rt
    WHERE rt.request_id = request_response_request_id
  ) IN (
    SELECT team_member_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
  )
)
WITH CHECK (
  (
    SELECT rt.request_team_member_id
    FROM request_table as rt
    WHERE rt.request_id = request_response_request_id
  ) IN (
    SELECT team_member_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
  )
);

CREATE POLICY "Allow DELETE for authenticated users on own request response" ON "public"."request_response_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  (
    SELECT rt.request_team_member_id
    FROM request_table as rt
    WHERE rt.request_id = request_response_request_id
  ) IN (
    SELECT team_member_id
    FROM team_member_table
    WHERE team_member_user_id = auth.uid()
  )
);

--- REQUEST_TABLE
CREATE POLICY "Allow CREATE access for all users" ON "public"."request_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ for authenticated users" ON "public"."request_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users on own requests" ON "public"."request_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  request_team_member_id IN (
    SELECT team_member_id  
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
  ) OR (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_id = request_team_member_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid() 
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
  request_team_member_id IN (
    SELECT team_member_id  
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
  ) OR (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_id = request_team_member_id
  ) IN (
    SELECT team_member_team_id 
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid() 
    AND team_member_role IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for authenticated users on own requests" ON "public"."request_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  request_team_member_id IN (
    SELECT team_member_id  
    FROM team_member_table 
    WHERE team_member_user_id = auth.uid()
  )
);

--- TEAM_TABLE
CREATE POLICY "Allow CREATE for authenticated users" ON "public"."team_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ for authenticated users" ON "public"."team_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users on own teams" ON "public"."team_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = team_user_id)
WITH CHECK (auth.uid() = team_user_id);

CREATE POLICY "Allow DELETE for authenticated users on own teams" ON "public"."team_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = team_user_id);

-- USER_TABLE
CREATE POLICY "Allow CREATE for authenticated users" ON "public"."user_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow READ for authenticated users" ON "public"."user_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow UPDATE for authenticated users based on user_id" ON "public"."user_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow DELETE for authenticated users based on user_id" ON "public"."user_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

--- FORM_TEAM_GROUP_TABLE
CREATE POLICY "Allow CREATE for OWNER or ADMIN roles" ON "public"."form_team_group_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT tt.team_group_team_id 
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ for authenticated team members" ON "public"."form_team_group_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT tt.team_group_team_id 
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND tm.team_member_user_id = auth.uid()
  )
);

CREATE POLICY "Allow UPDATE for OWNER or ADMIN roles" ON "public"."form_team_group_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT tt.team_group_team_id 
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT tt.team_group_team_id 
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for OWNER or ADMIN roles" ON "public"."form_team_group_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT tt.team_group_team_id 
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

--- TEAM_GROUP_MEMBER_TABLE
CREATE POLICY "Allow CREATE for OWNER or ADMIN roles" ON "public"."team_group_member_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT tt.team_group_team_id
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ for authenticated team members" ON "public"."team_group_member_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT tt.team_group_team_id
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND team_member_user_id = auth.uid()
  )
);

CREATE POLICY "Allow UPDATE for OWNER or ADMIN roles" ON "public"."team_group_member_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT tt.team_group_team_id
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
   EXISTS (
    SELECT tt.team_group_team_id
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for OWNER or ADMIN roles" ON "public"."team_group_member_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT tt.team_group_team_id
    FROM team_group_table as tt
    JOIN team_member_table as tm ON tm.team_member_team_id = tt.team_group_team_id
    WHERE tt.team_group_id = team_group_id
    AND team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

--- TEAM_GROUP_TABLE
CREATE POLICY "Allow CREATE for OWNER or ADMIN roles" ON "public"."team_group_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_group_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  ) 
);

CREATE POLICY "Allow READ for authenticated team members" ON "public"."team_group_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_group_team_id
    AND tm.team_member_user_id = auth.uid()
  ) 
);

CREATE POLICY "Allow UPDATE for OWNER or ADMIN roles" ON "public"."team_group_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_group_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  ) 
)
WITH CHECK (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_group_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  ) 
);

CREATE POLICY "Allow DELETE for OWNER or ADMIN roles" ON "public"."team_group_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_group_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  ) 
);

--- TEAM_PROJECT_MEMBER_TABLE
CREATE POLICY "Allow CREATE for OWNER or ADMIN roles" ON "public"."team_project_member_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT tp.team_project_team_id
    FROM team_project_table as tp
    JOIN team_member_table as tm ON tm.team_member_team_id = tp.team_project_team_id
    WHERE tp.team_project_id = team_project_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow READ for authenticated team members" ON "public"."team_project_member_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT tp.team_project_team_id
    FROM team_project_table as tp
    JOIN team_member_table as tm ON tm.team_member_team_id = tp.team_project_team_id
    WHERE tp.team_project_id = team_project_id
    AND tm.team_member_user_id = auth.uid()
  )
);

CREATE POLICY "Allow UPDATE for OWNER or ADMIN roles" ON "public"."team_project_member_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT tp.team_project_team_id
    FROM team_project_table as tp
    JOIN team_member_table as tm ON tm.team_member_team_id = tp.team_project_team_id
    WHERE tp.team_project_id = team_project_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT tp.team_project_team_id
    FROM team_project_table as tp
    JOIN team_member_table as tm ON tm.team_member_team_id = tp.team_project_team_id
    WHERE tp.team_project_id = team_project_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Allow DELETE for OWNER or ADMIN roles" ON "public"."team_project_member_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT tp.team_project_team_id
    FROM team_project_table as tp
    JOIN team_member_table as tm ON tm.team_member_team_id = tp.team_project_team_id
    WHERE tp.team_project_id = team_project_id
    AND tm.team_member_user_id = auth.uid()
    AND team_member_role in ('OWNER', 'ADMIN')
  )
);

--- TEAM_PROJECT_TABLE
CREATE POLICY "Allow CREATE for OWNER or ADMIN roles" ON "public"."team_project_table"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_project_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  ) 
);

CREATE POLICY "Allow READ for authenticated team members" ON "public"."team_project_table"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_project_team_id
    AND tm.team_member_user_id = auth.uid()
  ) 
);

CREATE POLICY "Allow UPDATE for OWNER or ADMIN roles" ON "public"."team_project_table"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_project_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  ) 
)
WITH CHECK (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_project_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  ) 
);

CREATE POLICY "Allow DELETE for OWNER or ADMIN roles" ON "public"."team_project_table"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT tm.team_member_team_id
    FROM team_member_table as tm
    JOIN user_table as ut ON ut.user_id = auth.uid()
    WHERE ut.user_active_team_id = team_project_team_id
    AND tm.team_member_user_id = auth.uid()
    AND tm.team_member_role IN ('OWNER', 'ADMIN')
  )
);

-------- End: POLICIES

---------- Start: INDEXES

CREATE INDEX request_response_request_id_idx ON request_response_table (request_response, request_response_request_id);
CREATE INDEX request_list_idx ON request_table (request_id, request_date_created, request_form_id, request_team_member_id, request_status);

-------- End: INDEXES

---------- Start: VIEWS

CREATE VIEW distinct_division_id AS SELECT DISTINCT csi_code_division_id from csi_code_table;

-------- End: VIEWS

GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO POSTGRES;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;