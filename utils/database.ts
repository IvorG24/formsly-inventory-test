export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attachment_table: {
        Row: {
          attachment_bucket: string
          attachment_date_created: string
          attachment_id: string
          attachment_is_disabled: boolean
          attachment_name: string
          attachment_value: string
        }
        Insert: {
          attachment_bucket: string
          attachment_date_created?: string
          attachment_id?: string
          attachment_is_disabled?: boolean
          attachment_name: string
          attachment_value: string
        }
        Update: {
          attachment_bucket?: string
          attachment_date_created?: string
          attachment_id?: string
          attachment_is_disabled?: boolean
          attachment_name?: string
          attachment_value?: string
        }
        Relationships: []
      }
      comment_table: {
        Row: {
          comment_content: string | null
          comment_date_created: string
          comment_id: string
          comment_is_disabled: boolean
          comment_is_edited: boolean | null
          comment_last_updated: string | null
          comment_request_id: string
          comment_team_member_id: string
          comment_type: string
        }
        Insert: {
          comment_content?: string | null
          comment_date_created?: string
          comment_id?: string
          comment_is_disabled?: boolean
          comment_is_edited?: boolean | null
          comment_last_updated?: string | null
          comment_request_id: string
          comment_team_member_id: string
          comment_type: string
        }
        Update: {
          comment_content?: string | null
          comment_date_created?: string
          comment_id?: string
          comment_is_disabled?: boolean
          comment_is_edited?: boolean | null
          comment_last_updated?: string | null
          comment_request_id?: string
          comment_team_member_id?: string
          comment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_table_comment_request_id_fkey"
            columns: ["comment_request_id"]
            isOneToOne: false
            referencedRelation: "request_table"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "comment_table_comment_team_member_id_fkey"
            columns: ["comment_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          }
        ]
      }
      csi_code_table: {
        Row: {
          csi_code_division_description: string
          csi_code_division_id: string
          csi_code_id: string
          csi_code_level_three_description: string
          csi_code_level_three_id: string
          csi_code_level_two_major_group_description: string
          csi_code_level_two_major_group_id: string
          csi_code_level_two_minor_group_description: string
          csi_code_level_two_minor_group_id: string
          csi_code_section: string
        }
        Insert: {
          csi_code_division_description: string
          csi_code_division_id: string
          csi_code_id?: string
          csi_code_level_three_description: string
          csi_code_level_three_id: string
          csi_code_level_two_major_group_description: string
          csi_code_level_two_major_group_id: string
          csi_code_level_two_minor_group_description: string
          csi_code_level_two_minor_group_id: string
          csi_code_section: string
        }
        Update: {
          csi_code_division_description?: string
          csi_code_division_id?: string
          csi_code_id?: string
          csi_code_level_three_description?: string
          csi_code_level_three_id?: string
          csi_code_level_two_major_group_description?: string
          csi_code_level_two_major_group_id?: string
          csi_code_level_two_minor_group_description?: string
          csi_code_level_two_minor_group_id?: string
          csi_code_section?: string
        }
        Relationships: []
      }
      equipment_brand_table: {
        Row: {
          equipment_brand: string
          equipment_brand_encoder_team_member_id: string | null
          equipment_brand_id: string
          equipment_brand_is_available: boolean
          equipment_brand_is_disabled: boolean
          equipment_brand_team_id: string
        }
        Insert: {
          equipment_brand: string
          equipment_brand_encoder_team_member_id?: string | null
          equipment_brand_id?: string
          equipment_brand_is_available?: boolean
          equipment_brand_is_disabled?: boolean
          equipment_brand_team_id: string
        }
        Update: {
          equipment_brand?: string
          equipment_brand_encoder_team_member_id?: string | null
          equipment_brand_id?: string
          equipment_brand_is_available?: boolean
          equipment_brand_is_disabled?: boolean
          equipment_brand_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_brand_table_equipment_brand_encoder_team_member__fkey"
            columns: ["equipment_brand_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "equipment_brand_table_equipment_brand_team_id_fkey"
            columns: ["equipment_brand_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      equipment_category_table: {
        Row: {
          equipment_category: string
          equipment_category_encoder_team_member_id: string | null
          equipment_category_id: string
          equipment_category_is_available: boolean
          equipment_category_is_disabled: boolean
          equipment_category_team_id: string
        }
        Insert: {
          equipment_category: string
          equipment_category_encoder_team_member_id?: string | null
          equipment_category_id?: string
          equipment_category_is_available?: boolean
          equipment_category_is_disabled?: boolean
          equipment_category_team_id: string
        }
        Update: {
          equipment_category?: string
          equipment_category_encoder_team_member_id?: string | null
          equipment_category_id?: string
          equipment_category_is_available?: boolean
          equipment_category_is_disabled?: boolean
          equipment_category_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_table_equipment_category_encoder_team_m_fkey"
            columns: ["equipment_category_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "equipment_category_table_equipment_category_team_id_fkey"
            columns: ["equipment_category_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      equipment_component_category_table: {
        Row: {
          equipment_component_category: string
          equipment_component_category_encoder_team_member_id: string | null
          equipment_component_category_id: string
          equipment_component_category_is_available: boolean
          equipment_component_category_is_disabled: boolean
          equipment_component_category_team_id: string
        }
        Insert: {
          equipment_component_category: string
          equipment_component_category_encoder_team_member_id?: string | null
          equipment_component_category_id?: string
          equipment_component_category_is_available?: boolean
          equipment_component_category_is_disabled?: boolean
          equipment_component_category_team_id: string
        }
        Update: {
          equipment_component_category?: string
          equipment_component_category_encoder_team_member_id?: string | null
          equipment_component_category_id?: string
          equipment_component_category_is_available?: boolean
          equipment_component_category_is_disabled?: boolean
          equipment_component_category_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_component_category__equipment_component_category_fkey"
            columns: ["equipment_component_category_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "equipment_component_category_equipment_component_category_fkey1"
            columns: ["equipment_component_category_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      equipment_description_table: {
        Row: {
          equipment_description_brand_id: string
          equipment_description_encoder_team_member_id: string | null
          equipment_description_equipment_id: string
          equipment_description_id: string
          equipment_description_is_available: boolean
          equipment_description_is_disabled: boolean
          equipment_description_model_id: string
          equipment_description_property_number: string
          equipment_description_serial_number: string
        }
        Insert: {
          equipment_description_brand_id: string
          equipment_description_encoder_team_member_id?: string | null
          equipment_description_equipment_id: string
          equipment_description_id?: string
          equipment_description_is_available?: boolean
          equipment_description_is_disabled?: boolean
          equipment_description_model_id: string
          equipment_description_property_number: string
          equipment_description_serial_number: string
        }
        Update: {
          equipment_description_brand_id?: string
          equipment_description_encoder_team_member_id?: string | null
          equipment_description_equipment_id?: string
          equipment_description_id?: string
          equipment_description_is_available?: boolean
          equipment_description_is_disabled?: boolean
          equipment_description_model_id?: string
          equipment_description_property_number?: string
          equipment_description_serial_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_description_table_equipment_description_brand_id_fkey"
            columns: ["equipment_description_brand_id"]
            isOneToOne: false
            referencedRelation: "equipment_brand_table"
            referencedColumns: ["equipment_brand_id"]
          },
          {
            foreignKeyName: "equipment_description_table_equipment_description_encoder__fkey"
            columns: ["equipment_description_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "equipment_description_table_equipment_description_equipmen_fkey"
            columns: ["equipment_description_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_table"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "equipment_description_table_equipment_description_model_id_fkey"
            columns: ["equipment_description_model_id"]
            isOneToOne: false
            referencedRelation: "equipment_model_table"
            referencedColumns: ["equipment_model_id"]
          }
        ]
      }
      equipment_model_table: {
        Row: {
          equipment_model: string
          equipment_model_encoder_team_member_id: string | null
          equipment_model_id: string
          equipment_model_is_available: boolean
          equipment_model_is_disabled: boolean
          equipment_model_team_id: string
        }
        Insert: {
          equipment_model: string
          equipment_model_encoder_team_member_id?: string | null
          equipment_model_id?: string
          equipment_model_is_available?: boolean
          equipment_model_is_disabled?: boolean
          equipment_model_team_id: string
        }
        Update: {
          equipment_model?: string
          equipment_model_encoder_team_member_id?: string | null
          equipment_model_id?: string
          equipment_model_is_available?: boolean
          equipment_model_is_disabled?: boolean
          equipment_model_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_model_table_equipment_model_encoder_team_member__fkey"
            columns: ["equipment_model_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "equipment_model_table_equipment_model_team_id_fkey"
            columns: ["equipment_model_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      equipment_part_table: {
        Row: {
          equipment_part_brand_id: string
          equipment_part_component_category_id: string
          equipment_part_encoder_team_member_id: string | null
          equipment_part_equipment_id: string
          equipment_part_id: string
          equipment_part_is_available: boolean
          equipment_part_is_disabled: boolean
          equipment_part_model_id: string
          equipment_part_name: string
          equipment_part_number: string
          equipment_part_unit_of_measurement_id: string
        }
        Insert: {
          equipment_part_brand_id: string
          equipment_part_component_category_id: string
          equipment_part_encoder_team_member_id?: string | null
          equipment_part_equipment_id: string
          equipment_part_id?: string
          equipment_part_is_available?: boolean
          equipment_part_is_disabled?: boolean
          equipment_part_model_id: string
          equipment_part_name: string
          equipment_part_number: string
          equipment_part_unit_of_measurement_id: string
        }
        Update: {
          equipment_part_brand_id?: string
          equipment_part_component_category_id?: string
          equipment_part_encoder_team_member_id?: string | null
          equipment_part_equipment_id?: string
          equipment_part_id?: string
          equipment_part_is_available?: boolean
          equipment_part_is_disabled?: boolean
          equipment_part_model_id?: string
          equipment_part_name?: string
          equipment_part_number?: string
          equipment_part_unit_of_measurement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_part_table_equipment_part_brand_id_fkey"
            columns: ["equipment_part_brand_id"]
            isOneToOne: false
            referencedRelation: "equipment_brand_table"
            referencedColumns: ["equipment_brand_id"]
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_component_category_id_fkey"
            columns: ["equipment_part_component_category_id"]
            isOneToOne: false
            referencedRelation: "equipment_component_category_table"
            referencedColumns: ["equipment_component_category_id"]
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_encoder_team_member_id_fkey"
            columns: ["equipment_part_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_equipment_id_fkey"
            columns: ["equipment_part_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_table"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_model_id_fkey"
            columns: ["equipment_part_model_id"]
            isOneToOne: false
            referencedRelation: "equipment_model_table"
            referencedColumns: ["equipment_model_id"]
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_unit_of_measurement_id_fkey"
            columns: ["equipment_part_unit_of_measurement_id"]
            isOneToOne: false
            referencedRelation: "equipment_unit_of_measurement_table"
            referencedColumns: ["equipment_unit_of_measurement_id"]
          }
        ]
      }
      equipment_table: {
        Row: {
          equipment_encoder_team_member_id: string | null
          equipment_equipment_category_id: string
          equipment_id: string
          equipment_is_available: boolean
          equipment_is_disabled: boolean
          equipment_name: string
          equipment_team_id: string
        }
        Insert: {
          equipment_encoder_team_member_id?: string | null
          equipment_equipment_category_id: string
          equipment_id?: string
          equipment_is_available?: boolean
          equipment_is_disabled?: boolean
          equipment_name: string
          equipment_team_id: string
        }
        Update: {
          equipment_encoder_team_member_id?: string | null
          equipment_equipment_category_id?: string
          equipment_id?: string
          equipment_is_available?: boolean
          equipment_is_disabled?: boolean
          equipment_name?: string
          equipment_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_table_equipment_encoder_team_member_id_fkey"
            columns: ["equipment_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "equipment_table_equipment_equipment_category_id_fkey"
            columns: ["equipment_equipment_category_id"]
            isOneToOne: false
            referencedRelation: "equipment_category_table"
            referencedColumns: ["equipment_category_id"]
          },
          {
            foreignKeyName: "equipment_table_equipment_team_id_fkey"
            columns: ["equipment_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      equipment_unit_of_measurement_table: {
        Row: {
          equipment_unit_of_measurement: string
          equipment_unit_of_measurement_encoder_team_member_id: string | null
          equipment_unit_of_measurement_id: string
          equipment_unit_of_measurement_is_available: boolean
          equipment_unit_of_measurement_is_disabled: boolean
          equipment_unit_of_measurement_team_id: string
        }
        Insert: {
          equipment_unit_of_measurement: string
          equipment_unit_of_measurement_encoder_team_member_id?: string | null
          equipment_unit_of_measurement_id?: string
          equipment_unit_of_measurement_is_available?: boolean
          equipment_unit_of_measurement_is_disabled?: boolean
          equipment_unit_of_measurement_team_id: string
        }
        Update: {
          equipment_unit_of_measurement?: string
          equipment_unit_of_measurement_encoder_team_member_id?: string | null
          equipment_unit_of_measurement_id?: string
          equipment_unit_of_measurement_is_available?: boolean
          equipment_unit_of_measurement_is_disabled?: boolean
          equipment_unit_of_measurement_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_unit_of_measuremen_equipment_unit_of_measuremen_fkey1"
            columns: ["equipment_unit_of_measurement_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "equipment_unit_of_measurement_equipment_unit_of_measuremen_fkey"
            columns: ["equipment_unit_of_measurement_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          }
        ]
      }
      field_table: {
        Row: {
          field_description: string | null
          field_id: string
          field_is_positive_metric: boolean
          field_is_read_only: boolean
          field_is_required: boolean
          field_name: string
          field_order: number
          field_section_id: string
          field_type: string
        }
        Insert: {
          field_description?: string | null
          field_id?: string
          field_is_positive_metric?: boolean
          field_is_read_only?: boolean
          field_is_required?: boolean
          field_name: string
          field_order: number
          field_section_id: string
          field_type: string
        }
        Update: {
          field_description?: string | null
          field_id?: string
          field_is_positive_metric?: boolean
          field_is_read_only?: boolean
          field_is_required?: boolean
          field_name?: string
          field_order?: number
          field_section_id?: string
          field_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_table_field_section_id_fkey"
            columns: ["field_section_id"]
            isOneToOne: false
            referencedRelation: "section_table"
            referencedColumns: ["section_id"]
          }
        ]
      }
      form_table: {
        Row: {
          form_app: string
          form_date_created: string
          form_description: string
          form_id: string
          form_is_disabled: boolean
          form_is_for_every_member: boolean
          form_is_formsly_form: boolean
          form_is_hidden: boolean
          form_is_signature_required: boolean
          form_name: string
          form_team_member_id: string
        }
        Insert: {
          form_app: string
          form_date_created?: string
          form_description: string
          form_id?: string
          form_is_disabled?: boolean
          form_is_for_every_member?: boolean
          form_is_formsly_form?: boolean
          form_is_hidden?: boolean
          form_is_signature_required?: boolean
          form_name: string
          form_team_member_id: string
        }
        Update: {
          form_app?: string
          form_date_created?: string
          form_description?: string
          form_id?: string
          form_is_disabled?: boolean
          form_is_for_every_member?: boolean
          form_is_formsly_form?: boolean
          form_is_hidden?: boolean
          form_is_signature_required?: boolean
          form_name?: string
          form_team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_table_form_team_member_id_fkey"
            columns: ["form_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          }
        ]
      }
      form_team_group_table: {
        Row: {
          form_id: string
          form_team_group_id: string
          team_group_id: string
        }
        Insert: {
          form_id: string
          form_team_group_id?: string
          team_group_id: string
        }
        Update: {
          form_id?: string
          form_team_group_id?: string
          team_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_team_group_table_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_table"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "form_team_group_table_team_group_id_fkey"
            columns: ["team_group_id"]
            isOneToOne: false
            referencedRelation: "team_group_table"
            referencedColumns: ["team_group_id"]
          }
        ]
      }
      invitation_table: {
        Row: {
          invitation_date_created: string
          invitation_from_team_member_id: string
          invitation_id: string
          invitation_is_disabled: boolean
          invitation_status: string
          invitation_to_email: string
        }
        Insert: {
          invitation_date_created?: string
          invitation_from_team_member_id: string
          invitation_id?: string
          invitation_is_disabled?: boolean
          invitation_status?: string
          invitation_to_email: string
        }
        Update: {
          invitation_date_created?: string
          invitation_from_team_member_id?: string
          invitation_id?: string
          invitation_is_disabled?: boolean
          invitation_status?: string
          invitation_to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_table_invitation_from_team_member_id_fkey"
            columns: ["invitation_from_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          }
        ]
      }
      item_description_field_table: {
        Row: {
          item_description_field_date_created: string
          item_description_field_encoder_team_member_id: string | null
          item_description_field_id: string
          item_description_field_is_available: boolean
          item_description_field_is_disabled: boolean
          item_description_field_item_description_id: string
          item_description_field_value: string
        }
        Insert: {
          item_description_field_date_created?: string
          item_description_field_encoder_team_member_id?: string | null
          item_description_field_id?: string
          item_description_field_is_available?: boolean
          item_description_field_is_disabled?: boolean
          item_description_field_item_description_id: string
          item_description_field_value: string
        }
        Update: {
          item_description_field_date_created?: string
          item_description_field_encoder_team_member_id?: string | null
          item_description_field_id?: string
          item_description_field_is_available?: boolean
          item_description_field_is_disabled?: boolean
          item_description_field_item_description_id?: string
          item_description_field_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_description_field_table_item_description_field_encode_fkey"
            columns: ["item_description_field_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "item_description_field_table_item_description_field_item_d_fkey"
            columns: ["item_description_field_item_description_id"]
            isOneToOne: false
            referencedRelation: "item_description_table"
            referencedColumns: ["item_description_id"]
          }
        ]
      }
      item_description_field_uom_table: {
        Row: {
          item_description_field_uom: string
          item_description_field_uom_id: string
          item_description_field_uom_item_description_field_id: string
        }
        Insert: {
          item_description_field_uom: string
          item_description_field_uom_id?: string
          item_description_field_uom_item_description_field_id: string
        }
        Update: {
          item_description_field_uom?: string
          item_description_field_uom_id?: string
          item_description_field_uom_item_description_field_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_description_field_uom_ta_item_description_field_uom_i_fkey"
            columns: ["item_description_field_uom_item_description_field_id"]
            isOneToOne: false
            referencedRelation: "item_description_field_table"
            referencedColumns: ["item_description_field_id"]
          }
        ]
      }
      item_description_table: {
        Row: {
          item_description_date_created: string
          item_description_field_id: string
          item_description_id: string
          item_description_is_available: boolean
          item_description_is_disabled: boolean
          item_description_is_with_uom: boolean
          item_description_item_id: string
          item_description_label: string
          item_description_order: number
        }
        Insert: {
          item_description_date_created?: string
          item_description_field_id: string
          item_description_id?: string
          item_description_is_available?: boolean
          item_description_is_disabled?: boolean
          item_description_is_with_uom?: boolean
          item_description_item_id: string
          item_description_label: string
          item_description_order: number
        }
        Update: {
          item_description_date_created?: string
          item_description_field_id?: string
          item_description_id?: string
          item_description_is_available?: boolean
          item_description_is_disabled?: boolean
          item_description_is_with_uom?: boolean
          item_description_item_id?: string
          item_description_label?: string
          item_description_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_description_table_item_description_field_id_fkey"
            columns: ["item_description_field_id"]
            isOneToOne: false
            referencedRelation: "field_table"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "item_description_table_item_description_item_id_fkey"
            columns: ["item_description_item_id"]
            isOneToOne: false
            referencedRelation: "item_table"
            referencedColumns: ["item_id"]
          }
        ]
      }
      item_division_table: {
        Row: {
          item_division_id: string
          item_division_item_id: string
          item_division_value: string
        }
        Insert: {
          item_division_id?: string
          item_division_item_id: string
          item_division_value: string
        }
        Update: {
          item_division_id?: string
          item_division_item_id?: string
          item_division_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_division_table_item_division_item_id_fkey"
            columns: ["item_division_item_id"]
            isOneToOne: false
            referencedRelation: "item_table"
            referencedColumns: ["item_id"]
          }
        ]
      }
      item_table: {
        Row: {
          item_date_created: string
          item_encoder_team_member_id: string | null
          item_general_name: string
          item_gl_account: string
          item_id: string
          item_is_available: boolean
          item_is_disabled: boolean
          item_team_id: string
          item_unit: string
        }
        Insert: {
          item_date_created?: string
          item_encoder_team_member_id?: string | null
          item_general_name: string
          item_gl_account: string
          item_id?: string
          item_is_available?: boolean
          item_is_disabled?: boolean
          item_team_id: string
          item_unit: string
        }
        Update: {
          item_date_created?: string
          item_encoder_team_member_id?: string | null
          item_general_name?: string
          item_gl_account?: string
          item_id?: string
          item_is_available?: boolean
          item_is_disabled?: boolean
          item_team_id?: string
          item_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_table_item_encoder_team_member_id_fkey"
            columns: ["item_encoder_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "item_table_item_team_id_fkey"
            columns: ["item_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      notification_table: {
        Row: {
          notification_app: string
          notification_content: string
          notification_date_created: string
          notification_id: string
          notification_is_read: boolean
          notification_redirect_url: string | null
          notification_team_id: string | null
          notification_type: string
          notification_user_id: string
        }
        Insert: {
          notification_app: string
          notification_content: string
          notification_date_created?: string
          notification_id?: string
          notification_is_read?: boolean
          notification_redirect_url?: string | null
          notification_team_id?: string | null
          notification_type: string
          notification_user_id: string
        }
        Update: {
          notification_app?: string
          notification_content?: string
          notification_date_created?: string
          notification_id?: string
          notification_is_read?: boolean
          notification_redirect_url?: string | null
          notification_team_id?: string | null
          notification_type?: string
          notification_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_table_notification_team_id_fkey"
            columns: ["notification_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "notification_table_notification_user_id_fkey"
            columns: ["notification_user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["user_id"]
          }
        ]
      }
      option_table: {
        Row: {
          option_field_id: string
          option_id: string
          option_order: number
          option_value: string
        }
        Insert: {
          option_field_id: string
          option_id?: string
          option_order: number
          option_value: string
        }
        Update: {
          option_field_id?: string
          option_id?: string
          option_order?: number
          option_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_table_option_field_id_fkey"
            columns: ["option_field_id"]
            isOneToOne: false
            referencedRelation: "field_table"
            referencedColumns: ["field_id"]
          }
        ]
      }
      request_response_table: {
        Row: {
          request_response: string
          request_response_duplicatable_section_id: string | null
          request_response_field_id: string
          request_response_id: string
          request_response_request_id: string
        }
        Insert: {
          request_response: string
          request_response_duplicatable_section_id?: string | null
          request_response_field_id: string
          request_response_id?: string
          request_response_request_id: string
        }
        Update: {
          request_response?: string
          request_response_duplicatable_section_id?: string | null
          request_response_field_id?: string
          request_response_id?: string
          request_response_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_response_table_request_response_field_id_fkey"
            columns: ["request_response_field_id"]
            isOneToOne: false
            referencedRelation: "field_table"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "request_response_table_request_response_request_id_fkey"
            columns: ["request_response_request_id"]
            isOneToOne: false
            referencedRelation: "request_table"
            referencedColumns: ["request_id"]
          }
        ]
      }
      request_signer_table: {
        Row: {
          request_signer_id: string
          request_signer_request_id: string
          request_signer_signer_id: string
          request_signer_status: string
          request_signer_status_date_updated: string | null
        }
        Insert: {
          request_signer_id?: string
          request_signer_request_id: string
          request_signer_signer_id: string
          request_signer_status?: string
          request_signer_status_date_updated?: string | null
        }
        Update: {
          request_signer_id?: string
          request_signer_request_id?: string
          request_signer_signer_id?: string
          request_signer_status?: string
          request_signer_status_date_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_signer_table_request_signer_request_id_fkey"
            columns: ["request_signer_request_id"]
            isOneToOne: false
            referencedRelation: "request_table"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "request_signer_table_request_signer_signer_id_fkey"
            columns: ["request_signer_signer_id"]
            isOneToOne: false
            referencedRelation: "signer_table"
            referencedColumns: ["signer_id"]
          }
        ]
      }
      request_table: {
        Row: {
          request_date_created: string
          request_form_id: string
          request_formsly_id: string | null
          request_id: string
          request_is_disabled: boolean
          request_jira_id: string | null
          request_jira_link: string | null
          request_otp_id: string | null
          request_project_id: string | null
          request_status: string
          request_status_date_updated: string | null
          request_team_member_id: string | null
        }
        Insert: {
          request_date_created?: string
          request_form_id: string
          request_formsly_id?: string | null
          request_id?: string
          request_is_disabled?: boolean
          request_jira_id?: string | null
          request_jira_link?: string | null
          request_otp_id?: string | null
          request_project_id?: string | null
          request_status?: string
          request_status_date_updated?: string | null
          request_team_member_id?: string | null
        }
        Update: {
          request_date_created?: string
          request_form_id?: string
          request_formsly_id?: string | null
          request_id?: string
          request_is_disabled?: boolean
          request_jira_id?: string | null
          request_jira_link?: string | null
          request_otp_id?: string | null
          request_project_id?: string | null
          request_status?: string
          request_status_date_updated?: string | null
          request_team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_table_request_form_id_fkey"
            columns: ["request_form_id"]
            isOneToOne: false
            referencedRelation: "form_table"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "request_table_request_project_id_fkey"
            columns: ["request_project_id"]
            isOneToOne: false
            referencedRelation: "team_project_table"
            referencedColumns: ["team_project_id"]
          },
          {
            foreignKeyName: "request_table_request_team_member_id_fkey"
            columns: ["request_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          }
        ]
      }
      section_table: {
        Row: {
          section_form_id: string
          section_id: string
          section_is_duplicatable: boolean
          section_name: string
          section_order: number
        }
        Insert: {
          section_form_id: string
          section_id?: string
          section_is_duplicatable?: boolean
          section_name: string
          section_order: number
        }
        Update: {
          section_form_id?: string
          section_id?: string
          section_is_duplicatable?: boolean
          section_name?: string
          section_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "section_table_section_form_id_fkey"
            columns: ["section_form_id"]
            isOneToOne: false
            referencedRelation: "form_table"
            referencedColumns: ["form_id"]
          }
        ]
      }
      service_scope_choice_table: {
        Row: {
          service_scope_choice_date_created: string
          service_scope_choice_id: string
          service_scope_choice_is_available: boolean
          service_scope_choice_is_disabled: boolean
          service_scope_choice_name: string
          service_scope_choice_service_scope_id: string
        }
        Insert: {
          service_scope_choice_date_created?: string
          service_scope_choice_id?: string
          service_scope_choice_is_available?: boolean
          service_scope_choice_is_disabled?: boolean
          service_scope_choice_name: string
          service_scope_choice_service_scope_id: string
        }
        Update: {
          service_scope_choice_date_created?: string
          service_scope_choice_id?: string
          service_scope_choice_is_available?: boolean
          service_scope_choice_is_disabled?: boolean
          service_scope_choice_name?: string
          service_scope_choice_service_scope_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_scope_choice_table_service_scope_choice_service_sc_fkey"
            columns: ["service_scope_choice_service_scope_id"]
            isOneToOne: false
            referencedRelation: "service_scope_table"
            referencedColumns: ["service_scope_id"]
          }
        ]
      }
      service_scope_table: {
        Row: {
          service_scope_date_created: string
          service_scope_field_id: string
          service_scope_id: string
          service_scope_is_available: boolean
          service_scope_is_disabled: boolean
          service_scope_is_with_other: boolean
          service_scope_name: string
          service_scope_service_id: string
          service_scope_type: string
        }
        Insert: {
          service_scope_date_created?: string
          service_scope_field_id: string
          service_scope_id?: string
          service_scope_is_available?: boolean
          service_scope_is_disabled?: boolean
          service_scope_is_with_other: boolean
          service_scope_name: string
          service_scope_service_id: string
          service_scope_type: string
        }
        Update: {
          service_scope_date_created?: string
          service_scope_field_id?: string
          service_scope_id?: string
          service_scope_is_available?: boolean
          service_scope_is_disabled?: boolean
          service_scope_is_with_other?: boolean
          service_scope_name?: string
          service_scope_service_id?: string
          service_scope_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_scope_table_service_scope_field_id_fkey"
            columns: ["service_scope_field_id"]
            isOneToOne: false
            referencedRelation: "field_table"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "service_scope_table_service_scope_service_id_fkey"
            columns: ["service_scope_service_id"]
            isOneToOne: false
            referencedRelation: "service_table"
            referencedColumns: ["service_id"]
          }
        ]
      }
      service_table: {
        Row: {
          service_date_created: string
          service_id: string
          service_is_available: boolean
          service_is_disabled: boolean
          service_name: string
          service_team_id: string
        }
        Insert: {
          service_date_created?: string
          service_id?: string
          service_is_available?: boolean
          service_is_disabled?: boolean
          service_name: string
          service_team_id: string
        }
        Update: {
          service_date_created?: string
          service_id?: string
          service_is_available?: boolean
          service_is_disabled?: boolean
          service_name?: string
          service_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_table_service_team_id_fkey"
            columns: ["service_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      signer_table: {
        Row: {
          signer_action: string
          signer_form_id: string
          signer_id: string
          signer_is_disabled: boolean
          signer_is_primary_signer: boolean
          signer_order: number
          signer_team_member_id: string
          signer_team_project_id: string | null
        }
        Insert: {
          signer_action: string
          signer_form_id: string
          signer_id?: string
          signer_is_disabled?: boolean
          signer_is_primary_signer?: boolean
          signer_order: number
          signer_team_member_id: string
          signer_team_project_id?: string | null
        }
        Update: {
          signer_action?: string
          signer_form_id?: string
          signer_id?: string
          signer_is_disabled?: boolean
          signer_is_primary_signer?: boolean
          signer_order?: number
          signer_team_member_id?: string
          signer_team_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signer_table_signer_form_id_fkey"
            columns: ["signer_form_id"]
            isOneToOne: false
            referencedRelation: "form_table"
            referencedColumns: ["form_id"]
          },
          {
            foreignKeyName: "signer_table_signer_team_member_id_fkey"
            columns: ["signer_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "signer_table_signer_team_project_id_fkey"
            columns: ["signer_team_project_id"]
            isOneToOne: false
            referencedRelation: "team_project_table"
            referencedColumns: ["team_project_id"]
          }
        ]
      }
      special_approver_item_table: {
        Row: {
          special_approver_item_id: string
          special_approver_item_special_approver_id: string
          special_approver_item_value: string
        }
        Insert: {
          special_approver_item_id?: string
          special_approver_item_special_approver_id: string
          special_approver_item_value: string
        }
        Update: {
          special_approver_item_id?: string
          special_approver_item_special_approver_id?: string
          special_approver_item_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_approver_item_table_special_approver_item_special__fkey"
            columns: ["special_approver_item_special_approver_id"]
            isOneToOne: false
            referencedRelation: "special_approver_table"
            referencedColumns: ["special_approver_id"]
          }
        ]
      }
      special_approver_table: {
        Row: {
          special_approver_id: string
          special_approver_signer_id: string
        }
        Insert: {
          special_approver_id?: string
          special_approver_signer_id: string
        }
        Update: {
          special_approver_id?: string
          special_approver_signer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_approver_table_special_approver_signer_id_fkey"
            columns: ["special_approver_signer_id"]
            isOneToOne: false
            referencedRelation: "signer_table"
            referencedColumns: ["signer_id"]
          }
        ]
      }
      supplier_table: {
        Row: {
          supplier_date_created: string
          supplier_id: string
          supplier_is_available: boolean
          supplier_is_disabled: boolean
          supplier_name: string
          supplier_team_id: string
        }
        Insert: {
          supplier_date_created?: string
          supplier_id?: string
          supplier_is_available?: boolean
          supplier_is_disabled?: boolean
          supplier_name: string
          supplier_team_id: string
        }
        Update: {
          supplier_date_created?: string
          supplier_id?: string
          supplier_is_available?: boolean
          supplier_is_disabled?: boolean
          supplier_name?: string
          supplier_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_table_supplier_team_id_fkey"
            columns: ["supplier_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      team_group_member_table: {
        Row: {
          team_group_id: string
          team_group_member_id: string
          team_member_id: string
        }
        Insert: {
          team_group_id: string
          team_group_member_id?: string
          team_member_id: string
        }
        Update: {
          team_group_id?: string
          team_group_member_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_group_member_table_team_group_id_fkey"
            columns: ["team_group_id"]
            isOneToOne: false
            referencedRelation: "team_group_table"
            referencedColumns: ["team_group_id"]
          },
          {
            foreignKeyName: "team_group_member_table_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          }
        ]
      }
      team_group_table: {
        Row: {
          team_group_date_created: string
          team_group_id: string
          team_group_is_disabled: boolean
          team_group_name: string
          team_group_team_id: string
        }
        Insert: {
          team_group_date_created?: string
          team_group_id?: string
          team_group_is_disabled?: boolean
          team_group_name: string
          team_group_team_id: string
        }
        Update: {
          team_group_date_created?: string
          team_group_id?: string
          team_group_is_disabled?: boolean
          team_group_name?: string
          team_group_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_group_table_team_group_team_id_fkey"
            columns: ["team_group_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      team_member_table: {
        Row: {
          team_member_date_created: string
          team_member_id: string
          team_member_is_disabled: boolean
          team_member_role: string
          team_member_team_id: string
          team_member_user_id: string
        }
        Insert: {
          team_member_date_created?: string
          team_member_id?: string
          team_member_is_disabled?: boolean
          team_member_role?: string
          team_member_team_id: string
          team_member_user_id: string
        }
        Update: {
          team_member_date_created?: string
          team_member_id?: string
          team_member_is_disabled?: boolean
          team_member_role?: string
          team_member_team_id?: string
          team_member_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_table_team_member_team_id_fkey"
            columns: ["team_member_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_member_table_team_member_user_id_fkey"
            columns: ["team_member_user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["user_id"]
          }
        ]
      }
      team_project_member_table: {
        Row: {
          team_member_id: string
          team_project_id: string
          team_project_member_id: string
        }
        Insert: {
          team_member_id: string
          team_project_id: string
          team_project_member_id?: string
        }
        Update: {
          team_member_id?: string
          team_project_id?: string
          team_project_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_project_member_table_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "team_project_member_table_team_project_id_fkey"
            columns: ["team_project_id"]
            isOneToOne: false
            referencedRelation: "team_project_table"
            referencedColumns: ["team_project_id"]
          }
        ]
      }
      team_project_table: {
        Row: {
          team_project_code: string
          team_project_date_created: string
          team_project_id: string
          team_project_is_disabled: boolean
          team_project_name: string
          team_project_team_id: string
        }
        Insert: {
          team_project_code: string
          team_project_date_created?: string
          team_project_id?: string
          team_project_is_disabled?: boolean
          team_project_name: string
          team_project_team_id: string
        }
        Update: {
          team_project_code?: string
          team_project_date_created?: string
          team_project_id?: string
          team_project_is_disabled?: boolean
          team_project_name?: string
          team_project_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_project_table_team_project_team_id_fkey"
            columns: ["team_project_team_id"]
            isOneToOne: false
            referencedRelation: "team_table"
            referencedColumns: ["team_id"]
          }
        ]
      }
      team_table: {
        Row: {
          team_date_created: string
          team_id: string
          team_is_disabled: boolean
          team_is_request_signature_required: boolean
          team_logo: string | null
          team_name: string
          team_user_id: string
        }
        Insert: {
          team_date_created?: string
          team_id?: string
          team_is_disabled?: boolean
          team_is_request_signature_required?: boolean
          team_logo?: string | null
          team_name: string
          team_user_id: string
        }
        Update: {
          team_date_created?: string
          team_id?: string
          team_is_disabled?: boolean
          team_is_request_signature_required?: boolean
          team_logo?: string | null
          team_name?: string
          team_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_table_team_user_id_fkey"
            columns: ["team_user_id"]
            isOneToOne: false
            referencedRelation: "user_table"
            referencedColumns: ["user_id"]
          }
        ]
      }
      ticket_comment_table: {
        Row: {
          ticket_comment_content: string
          ticket_comment_date_created: string
          ticket_comment_id: string
          ticket_comment_is_disabled: boolean
          ticket_comment_is_edited: boolean
          ticket_comment_last_updated: string | null
          ticket_comment_team_member_id: string
          ticket_comment_ticket_id: string
          ticket_comment_type: string
        }
        Insert: {
          ticket_comment_content: string
          ticket_comment_date_created?: string
          ticket_comment_id?: string
          ticket_comment_is_disabled?: boolean
          ticket_comment_is_edited?: boolean
          ticket_comment_last_updated?: string | null
          ticket_comment_team_member_id: string
          ticket_comment_ticket_id: string
          ticket_comment_type: string
        }
        Update: {
          ticket_comment_content?: string
          ticket_comment_date_created?: string
          ticket_comment_id?: string
          ticket_comment_is_disabled?: boolean
          ticket_comment_is_edited?: boolean
          ticket_comment_last_updated?: string | null
          ticket_comment_team_member_id?: string
          ticket_comment_ticket_id?: string
          ticket_comment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comment_table_ticket_comment_team_member_id_fkey"
            columns: ["ticket_comment_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "ticket_comment_table_ticket_comment_ticket_id_fkey"
            columns: ["ticket_comment_ticket_id"]
            isOneToOne: false
            referencedRelation: "ticket_table"
            referencedColumns: ["ticket_id"]
          }
        ]
      }
      ticket_table: {
        Row: {
          ticket_approver_team_member_id: string | null
          ticket_category: string
          ticket_date_created: string
          ticket_description: string
          ticket_id: string
          ticket_requester_team_member_id: string
          ticket_status: string
          ticket_status_date_updated: string | null
          ticket_title: string
        }
        Insert: {
          ticket_approver_team_member_id?: string | null
          ticket_category: string
          ticket_date_created?: string
          ticket_description: string
          ticket_id?: string
          ticket_requester_team_member_id: string
          ticket_status?: string
          ticket_status_date_updated?: string | null
          ticket_title: string
        }
        Update: {
          ticket_approver_team_member_id?: string | null
          ticket_category?: string
          ticket_date_created?: string
          ticket_description?: string
          ticket_id?: string
          ticket_requester_team_member_id?: string
          ticket_status?: string
          ticket_status_date_updated?: string | null
          ticket_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_table_ticket_approver_team_member_id_fkey"
            columns: ["ticket_approver_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "ticket_table_ticket_requester_team_member_id_fkey"
            columns: ["ticket_requester_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member_table"
            referencedColumns: ["team_member_id"]
          }
        ]
      }
      user_table: {
        Row: {
          user_active_app: string
          user_active_team_id: string | null
          user_avatar: string | null
          user_date_created: string
          user_email: string
          user_first_name: string
          user_id: string
          user_is_disabled: boolean
          user_job_title: string | null
          user_last_name: string
          user_phone_number: string | null
          user_signature_attachment_id: string | null
          user_username: string
        }
        Insert: {
          user_active_app?: string
          user_active_team_id?: string | null
          user_avatar?: string | null
          user_date_created?: string
          user_email: string
          user_first_name: string
          user_id?: string
          user_is_disabled?: boolean
          user_job_title?: string | null
          user_last_name: string
          user_phone_number?: string | null
          user_signature_attachment_id?: string | null
          user_username: string
        }
        Update: {
          user_active_app?: string
          user_active_team_id?: string | null
          user_avatar?: string | null
          user_date_created?: string
          user_email?: string
          user_first_name?: string
          user_id?: string
          user_is_disabled?: boolean
          user_job_title?: string | null
          user_last_name?: string
          user_phone_number?: string | null
          user_signature_attachment_id?: string | null
          user_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_table_user_signature_attachment_id_fkey"
            columns: ["user_signature_attachment_id"]
            isOneToOne: false
            referencedRelation: "attachment_table"
            referencedColumns: ["attachment_id"]
          }
        ]
      }
    }
    Views: {
      distinct_division_view: {
        Row: {
          csi_code_division_description: string | null
          csi_code_division_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_team_invitation: {
        Args: {
          invitation_id: string
          team_id: string
          user_id: string
        }
        Returns: Json
      }
      analyze_item: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      approve_or_reject_request: {
        Args: {
          input_data: Json
        }
        Returns: undefined
      }
      approve_sourced_requisition_request: {
        Args: {
          input_data: Json
        }
        Returns: undefined
      }
      assign_ticket: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      build_form_page_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      cancel_request: {
        Args: {
          request_id: string
          member_id: string
          comment_type: string
          comment_content: string
        }
        Returns: undefined
      }
      canvass_page_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      check_requisition_form_status: {
        Args: {
          team_id: string
          form_id: string
        }
        Returns: string
      }
      check_requisition_quantity: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      check_rir_item_quantity: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      check_ro_item_quantity: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      check_subcon_form_status: {
        Args: {
          team_id: string
          form_id: string
        }
        Returns: string
      }
      check_tranfer_receipt_item_quantity: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_formsly_premade_forms: {
        Args: {
          input_data: Json
        }
        Returns: undefined
      }
      create_item: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_request: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_request_form: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_request_page_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_service: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_team_invitation: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_team_project: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_ticket: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      create_user: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      delete_team: {
        Args: {
          team_id: string
          team_member_id: string
        }
        Returns: undefined
      }
      edit_request: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      edit_ticket_response: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      fetch_dashboard_top_requestor: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      fetch_dashboard_top_signer: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      fetch_request_list: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      fetch_ticket_list: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      form_list_page_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      form_page_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_all_approved_requisition_json: {
        Args: {
          team_id: string
        }
        Returns: Json
      }
      get_all_notification: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_all_team_members_without_group_members: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_all_team_members_without_project_members: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_create_ticket_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_current_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_edit_request_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_notification_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_request: {
        Args: {
          request_id: string
        }
        Returns: Json
      }
      get_request_list_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_ssot: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_ssot_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_team_member_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_team_member_with_filter: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_team_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_ticket_list_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_ticket_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_user_active_team_id: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      insert_group_member: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      insert_project_member: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      leave_team: {
        Args: {
          team_id: string
          team_member_id: string
        }
        Returns: undefined
      }
      redirect_to_new_team: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      request_page_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      reverse_request_approval: {
        Args: {
          input_data: Json
        }
        Returns: undefined
      }
      transfer_ownership: {
        Args: {
          owner_id: string
          member_id: string
        }
        Returns: undefined
      }
      update_form_group: {
        Args: {
          input_data: Json
        }
        Returns: undefined
      }
      update_form_signer: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_item: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_multiple_admin: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_multiple_approver: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_ticket_status: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
