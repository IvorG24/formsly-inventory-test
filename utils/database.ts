export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  equipment_schema: {
    Tables: {
      equipment_brand_table: {
        Row: {
          equipment_brand: string;
          equipment_brand_date_created: string;
          equipment_brand_id: string;
          equipment_brand_is_available: boolean;
          equipment_brand_is_disabled: boolean;
          equipment_brand_team_id: string;
        };
        Insert: {
          equipment_brand: string;
          equipment_brand_date_created?: string;
          equipment_brand_id?: string;
          equipment_brand_is_available?: boolean;
          equipment_brand_is_disabled?: boolean;
          equipment_brand_team_id: string;
        };
        Update: {
          equipment_brand?: string;
          equipment_brand_date_created?: string;
          equipment_brand_id?: string;
          equipment_brand_is_available?: boolean;
          equipment_brand_is_disabled?: boolean;
          equipment_brand_team_id?: string;
        };
        Relationships: [];
      };
      equipment_category_table: {
        Row: {
          equipment_category: string;
          equipment_category_date_created: string;
          equipment_category_id: string;
          equipment_category_is_available: boolean;
          equipment_category_is_disabled: boolean;
          equipment_category_team_id: string;
        };
        Insert: {
          equipment_category: string;
          equipment_category_date_created?: string;
          equipment_category_id?: string;
          equipment_category_is_available?: boolean;
          equipment_category_is_disabled?: boolean;
          equipment_category_team_id: string;
        };
        Update: {
          equipment_category?: string;
          equipment_category_date_created?: string;
          equipment_category_id?: string;
          equipment_category_is_available?: boolean;
          equipment_category_is_disabled?: boolean;
          equipment_category_team_id?: string;
        };
        Relationships: [];
      };
      equipment_component_category_table: {
        Row: {
          equipment_component_category: string;
          equipment_component_category_id: string;
          equipment_component_category_is_available: boolean;
          equipment_component_category_is_disabled: boolean;
          equipment_component_category_team_id: string;
          equipment_component_date_created: string;
        };
        Insert: {
          equipment_component_category: string;
          equipment_component_category_id?: string;
          equipment_component_category_is_available?: boolean;
          equipment_component_category_is_disabled?: boolean;
          equipment_component_category_team_id: string;
          equipment_component_date_created?: string;
        };
        Update: {
          equipment_component_category?: string;
          equipment_component_category_id?: string;
          equipment_component_category_is_available?: boolean;
          equipment_component_category_is_disabled?: boolean;
          equipment_component_category_team_id?: string;
          equipment_component_date_created?: string;
        };
        Relationships: [];
      };
      equipment_description_table: {
        Row: {
          equipment_description_acquisition_date: number | null;
          equipment_description_brand_id: string;
          equipment_description_date_created: string;
          equipment_description_equipment_id: string;
          equipment_description_id: string;
          equipment_description_is_available: boolean;
          equipment_description_is_disabled: boolean;
          equipment_description_is_rental: boolean;
          equipment_description_model_id: string;
          equipment_description_property_number: string;
          equipment_description_serial_number: string;
        };
        Insert: {
          equipment_description_acquisition_date?: number | null;
          equipment_description_brand_id: string;
          equipment_description_date_created?: string;
          equipment_description_equipment_id: string;
          equipment_description_id?: string;
          equipment_description_is_available?: boolean;
          equipment_description_is_disabled?: boolean;
          equipment_description_is_rental?: boolean;
          equipment_description_model_id: string;
          equipment_description_property_number: string;
          equipment_description_serial_number: string;
        };
        Update: {
          equipment_description_acquisition_date?: number | null;
          equipment_description_brand_id?: string;
          equipment_description_date_created?: string;
          equipment_description_equipment_id?: string;
          equipment_description_id?: string;
          equipment_description_is_available?: boolean;
          equipment_description_is_disabled?: boolean;
          equipment_description_is_rental?: boolean;
          equipment_description_model_id?: string;
          equipment_description_property_number?: string;
          equipment_description_serial_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_description_table_equipment_description_brand_id_fkey";
            columns: ["equipment_description_brand_id"];
            isOneToOne: false;
            referencedRelation: "equipment_brand_table";
            referencedColumns: ["equipment_brand_id"];
          },
          {
            foreignKeyName: "equipment_description_table_equipment_description_equipmen_fkey";
            columns: ["equipment_description_equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment_table";
            referencedColumns: ["equipment_id"];
          },
          {
            foreignKeyName: "equipment_description_table_equipment_description_model_id_fkey";
            columns: ["equipment_description_model_id"];
            isOneToOne: false;
            referencedRelation: "equipment_model_table";
            referencedColumns: ["equipment_model_id"];
          },
        ];
      };
      equipment_general_name_table: {
        Row: {
          equipment_general_name: string;
          equipment_general_name_date_created: string;
          equipment_general_name_id: string;
          equipment_general_name_is_available: boolean;
          equipment_general_name_is_disabled: boolean;
          equipment_general_name_team_id: string;
        };
        Insert: {
          equipment_general_name: string;
          equipment_general_name_date_created?: string;
          equipment_general_name_id?: string;
          equipment_general_name_is_available?: boolean;
          equipment_general_name_is_disabled?: boolean;
          equipment_general_name_team_id: string;
        };
        Update: {
          equipment_general_name?: string;
          equipment_general_name_date_created?: string;
          equipment_general_name_id?: string;
          equipment_general_name_is_available?: boolean;
          equipment_general_name_is_disabled?: boolean;
          equipment_general_name_team_id?: string;
        };
        Relationships: [];
      };
      equipment_model_table: {
        Row: {
          equipment_model: string;
          equipment_model_date_created: string;
          equipment_model_id: string;
          equipment_model_is_available: boolean;
          equipment_model_is_disabled: boolean;
          equipment_model_team_id: string;
        };
        Insert: {
          equipment_model: string;
          equipment_model_date_created?: string;
          equipment_model_id?: string;
          equipment_model_is_available?: boolean;
          equipment_model_is_disabled?: boolean;
          equipment_model_team_id: string;
        };
        Update: {
          equipment_model?: string;
          equipment_model_date_created?: string;
          equipment_model_id?: string;
          equipment_model_is_available?: boolean;
          equipment_model_is_disabled?: boolean;
          equipment_model_team_id?: string;
        };
        Relationships: [];
      };
      equipment_part_table: {
        Row: {
          equipment_part_brand_id: string;
          equipment_part_component_category_id: string;
          equipment_part_date_created: string;
          equipment_part_equipment_id: string;
          equipment_part_general_name_id: string;
          equipment_part_id: string;
          equipment_part_is_available: boolean;
          equipment_part_is_disabled: boolean;
          equipment_part_model_id: string;
          equipment_part_number: string;
          equipment_part_unit_of_measurement_id: string;
        };
        Insert: {
          equipment_part_brand_id: string;
          equipment_part_component_category_id: string;
          equipment_part_date_created?: string;
          equipment_part_equipment_id: string;
          equipment_part_general_name_id: string;
          equipment_part_id?: string;
          equipment_part_is_available?: boolean;
          equipment_part_is_disabled?: boolean;
          equipment_part_model_id: string;
          equipment_part_number: string;
          equipment_part_unit_of_measurement_id: string;
        };
        Update: {
          equipment_part_brand_id?: string;
          equipment_part_component_category_id?: string;
          equipment_part_date_created?: string;
          equipment_part_equipment_id?: string;
          equipment_part_general_name_id?: string;
          equipment_part_id?: string;
          equipment_part_is_available?: boolean;
          equipment_part_is_disabled?: boolean;
          equipment_part_model_id?: string;
          equipment_part_number?: string;
          equipment_part_unit_of_measurement_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_part_table_equipment_part_brand_id_fkey";
            columns: ["equipment_part_brand_id"];
            isOneToOne: false;
            referencedRelation: "equipment_brand_table";
            referencedColumns: ["equipment_brand_id"];
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_component_category_id_fkey";
            columns: ["equipment_part_component_category_id"];
            isOneToOne: false;
            referencedRelation: "equipment_component_category_table";
            referencedColumns: ["equipment_component_category_id"];
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_equipment_id_fkey";
            columns: ["equipment_part_equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment_table";
            referencedColumns: ["equipment_id"];
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_general_name_id_fkey";
            columns: ["equipment_part_general_name_id"];
            isOneToOne: false;
            referencedRelation: "equipment_general_name_table";
            referencedColumns: ["equipment_general_name_id"];
          },
          {
            foreignKeyName: "equipment_part_table_equipment_part_model_id_fkey";
            columns: ["equipment_part_model_id"];
            isOneToOne: false;
            referencedRelation: "equipment_model_table";
            referencedColumns: ["equipment_model_id"];
          },
        ];
      };
      equipment_table: {
        Row: {
          equipment_date_created: string;
          equipment_equipment_category_id: string;
          equipment_id: string;
          equipment_is_available: boolean;
          equipment_is_disabled: boolean;
          equipment_name: string;
          equipment_name_shorthand: string;
          equipment_team_id: string;
        };
        Insert: {
          equipment_date_created?: string;
          equipment_equipment_category_id: string;
          equipment_id?: string;
          equipment_is_available?: boolean;
          equipment_is_disabled?: boolean;
          equipment_name: string;
          equipment_name_shorthand: string;
          equipment_team_id: string;
        };
        Update: {
          equipment_date_created?: string;
          equipment_equipment_category_id?: string;
          equipment_id?: string;
          equipment_is_available?: boolean;
          equipment_is_disabled?: boolean;
          equipment_name?: string;
          equipment_name_shorthand?: string;
          equipment_team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_table_equipment_equipment_category_id_fkey";
            columns: ["equipment_equipment_category_id"];
            isOneToOne: false;
            referencedRelation: "equipment_category_table";
            referencedColumns: ["equipment_category_id"];
          },
        ];
      };
    };
    Views: {
      equipment_description_view: {
        Row: {
          equipment_description_acquisition_date: number | null;
          equipment_description_brand_id: string | null;
          equipment_description_date_created: string | null;
          equipment_description_equipment_id: string | null;
          equipment_description_id: string | null;
          equipment_description_is_available: boolean | null;
          equipment_description_is_disabled: boolean | null;
          equipment_description_is_rental: boolean | null;
          equipment_description_model_id: string | null;
          equipment_description_property_number: string | null;
          equipment_description_property_number_with_prefix: string | null;
          equipment_description_serial_number: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_description_table_equipment_description_brand_id_fkey";
            columns: ["equipment_description_brand_id"];
            isOneToOne: false;
            referencedRelation: "equipment_brand_table";
            referencedColumns: ["equipment_brand_id"];
          },
          {
            foreignKeyName: "equipment_description_table_equipment_description_equipmen_fkey";
            columns: ["equipment_description_equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment_table";
            referencedColumns: ["equipment_id"];
          },
          {
            foreignKeyName: "equipment_description_table_equipment_description_model_id_fkey";
            columns: ["equipment_description_model_id"];
            isOneToOne: false;
            referencedRelation: "equipment_model_table";
            referencedColumns: ["equipment_model_id"];
          },
        ];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  form_schema: {
    Tables: {
      correct_response_table: {
        Row: {
          correct_response_field_id: string;
          correct_response_id: string;
          correct_response_value: string;
        };
        Insert: {
          correct_response_field_id: string;
          correct_response_id?: string;
          correct_response_value: string;
        };
        Update: {
          correct_response_field_id?: string;
          correct_response_id?: string;
          correct_response_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "correct_response_table_correct_response_field_id_fkey";
            columns: ["correct_response_field_id"];
            isOneToOne: false;
            referencedRelation: "field_table";
            referencedColumns: ["field_id"];
          },
        ];
      };
      field_table: {
        Row: {
          field_id: string;
          field_is_positive_metric: boolean;
          field_is_read_only: boolean;
          field_is_required: boolean;
          field_name: string;
          field_order: number;
          field_section_id: string;
          field_special_field_template_id: string | null;
          field_type: string;
        };
        Insert: {
          field_id?: string;
          field_is_positive_metric?: boolean;
          field_is_read_only?: boolean;
          field_is_required?: boolean;
          field_name: string;
          field_order: number;
          field_section_id: string;
          field_special_field_template_id?: string | null;
          field_type: string;
        };
        Update: {
          field_id?: string;
          field_is_positive_metric?: boolean;
          field_is_read_only?: boolean;
          field_is_required?: boolean;
          field_name?: string;
          field_order?: number;
          field_section_id?: string;
          field_special_field_template_id?: string | null;
          field_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "field_table_field_section_id_fkey";
            columns: ["field_section_id"];
            isOneToOne: false;
            referencedRelation: "section_table";
            referencedColumns: ["section_id"];
          },
          {
            foreignKeyName: "field_table_field_special_field_template_id_fkey";
            columns: ["field_special_field_template_id"];
            isOneToOne: false;
            referencedRelation: "special_field_template_table";
            referencedColumns: ["special_field_template_id"];
          },
        ];
      };
      form_sla_table: {
        Row: {
          form_sla_date_created: string;
          form_sla_date_updated: string | null;
          form_sla_form_id: string;
          form_sla_hours: number;
          form_sla_id: string;
          form_sla_team_id: string;
        };
        Insert: {
          form_sla_date_created?: string;
          form_sla_date_updated?: string | null;
          form_sla_form_id: string;
          form_sla_hours: number;
          form_sla_id?: string;
          form_sla_team_id: string;
        };
        Update: {
          form_sla_date_created?: string;
          form_sla_date_updated?: string | null;
          form_sla_form_id?: string;
          form_sla_hours?: number;
          form_sla_id?: string;
          form_sla_team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "form_sla_table_form_sla_form_id_fkey";
            columns: ["form_sla_form_id"];
            isOneToOne: false;
            referencedRelation: "form_table";
            referencedColumns: ["form_id"];
          },
        ];
      };
      form_table: {
        Row: {
          form_app: string;
          form_date_created: string;
          form_description: string;
          form_id: string;
          form_is_disabled: boolean;
          form_is_for_every_member: boolean;
          form_is_formsly_form: boolean;
          form_is_hidden: boolean;
          form_is_public_form: boolean;
          form_is_signature_required: boolean;
          form_name: string;
          form_sub_type: string | null;
          form_team_member_id: string;
          form_type: string | null;
        };
        Insert: {
          form_app: string;
          form_date_created?: string;
          form_description: string;
          form_id?: string;
          form_is_disabled?: boolean;
          form_is_for_every_member?: boolean;
          form_is_formsly_form?: boolean;
          form_is_hidden?: boolean;
          form_is_public_form?: boolean;
          form_is_signature_required?: boolean;
          form_name: string;
          form_sub_type?: string | null;
          form_team_member_id: string;
          form_type?: string | null;
        };
        Update: {
          form_app?: string;
          form_date_created?: string;
          form_description?: string;
          form_id?: string;
          form_is_disabled?: boolean;
          form_is_for_every_member?: boolean;
          form_is_formsly_form?: boolean;
          form_is_hidden?: boolean;
          form_is_public_form?: boolean;
          form_is_signature_required?: boolean;
          form_name?: string;
          form_sub_type?: string | null;
          form_team_member_id?: string;
          form_type?: string | null;
        };
        Relationships: [];
      };
      form_team_group_table: {
        Row: {
          form_id: string;
          form_team_group_id: string;
          team_group_id: string;
        };
        Insert: {
          form_id: string;
          form_team_group_id?: string;
          team_group_id: string;
        };
        Update: {
          form_id?: string;
          form_team_group_id?: string;
          team_group_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "form_team_group_table_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "form_table";
            referencedColumns: ["form_id"];
          },
        ];
      };
      option_table: {
        Row: {
          option_field_id: string;
          option_id: string;
          option_order: number;
          option_value: string;
        };
        Insert: {
          option_field_id: string;
          option_id?: string;
          option_order: number;
          option_value: string;
        };
        Update: {
          option_field_id?: string;
          option_id?: string;
          option_order?: number;
          option_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "option_table_option_field_id_fkey";
            columns: ["option_field_id"];
            isOneToOne: false;
            referencedRelation: "field_table";
            referencedColumns: ["field_id"];
          },
        ];
      };
      question_option_table: {
        Row: {
          question_option_id: string;
          question_option_order: number;
          question_option_questionnaire_question_id: string;
          question_option_value: string | null;
        };
        Insert: {
          question_option_id?: string;
          question_option_order: number;
          question_option_questionnaire_question_id: string;
          question_option_value?: string | null;
        };
        Update: {
          question_option_id?: string;
          question_option_order?: number;
          question_option_questionnaire_question_id?: string;
          question_option_value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "question_option_table_question_option_questionnaire_questi_fkey";
            columns: ["question_option_questionnaire_question_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_question_table";
            referencedColumns: ["questionnaire_question_id"];
          },
        ];
      };
      questionnaire_question_table: {
        Row: {
          questionnaire_question: string;
          questionnaire_question_date_created: string;
          questionnaire_question_field_id: string;
          questionnaire_question_id: string;
          questionnaire_question_is_disabled: boolean | null;
          questionnaire_question_questionnaire_id: string;
        };
        Insert: {
          questionnaire_question: string;
          questionnaire_question_date_created?: string;
          questionnaire_question_field_id: string;
          questionnaire_question_id?: string;
          questionnaire_question_is_disabled?: boolean | null;
          questionnaire_question_questionnaire_id: string;
        };
        Update: {
          questionnaire_question?: string;
          questionnaire_question_date_created?: string;
          questionnaire_question_field_id?: string;
          questionnaire_question_id?: string;
          questionnaire_question_is_disabled?: boolean | null;
          questionnaire_question_questionnaire_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questionnaire_question_table_questionnaire_question_field__fkey";
            columns: ["questionnaire_question_field_id"];
            isOneToOne: false;
            referencedRelation: "field_table";
            referencedColumns: ["field_id"];
          },
          {
            foreignKeyName: "questionnaire_question_table_questionnaire_question_questi_fkey";
            columns: ["questionnaire_question_questionnaire_id"];
            isOneToOne: false;
            referencedRelation: "questionnaire_table";
            referencedColumns: ["questionnaire_id"];
          },
        ];
      };
      questionnaire_table: {
        Row: {
          questionnaire_created_by: string;
          questionnaire_date_created: string;
          questionnaire_date_updated: string | null;
          questionnaire_id: string;
          questionnaire_is_disabled: boolean | null;
          questionnaire_name: string;
          questionnaire_team_id: string;
          questionnaire_updated_by: string | null;
        };
        Insert: {
          questionnaire_created_by: string;
          questionnaire_date_created?: string;
          questionnaire_date_updated?: string | null;
          questionnaire_id?: string;
          questionnaire_is_disabled?: boolean | null;
          questionnaire_name: string;
          questionnaire_team_id: string;
          questionnaire_updated_by?: string | null;
        };
        Update: {
          questionnaire_created_by?: string;
          questionnaire_date_created?: string;
          questionnaire_date_updated?: string | null;
          questionnaire_id?: string;
          questionnaire_is_disabled?: boolean | null;
          questionnaire_name?: string;
          questionnaire_team_id?: string;
          questionnaire_updated_by?: string | null;
        };
        Relationships: [];
      };
      section_table: {
        Row: {
          section_form_id: string;
          section_id: string;
          section_is_duplicatable: boolean;
          section_name: string;
          section_order: number;
        };
        Insert: {
          section_form_id: string;
          section_id?: string;
          section_is_duplicatable?: boolean;
          section_name: string;
          section_order: number;
        };
        Update: {
          section_form_id?: string;
          section_id?: string;
          section_is_duplicatable?: boolean;
          section_name?: string;
          section_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "section_table_section_form_id_fkey";
            columns: ["section_form_id"];
            isOneToOne: false;
            referencedRelation: "form_table";
            referencedColumns: ["form_id"];
          },
        ];
      };
      signer_table: {
        Row: {
          signer_action: string;
          signer_form_id: string;
          signer_id: string;
          signer_is_disabled: boolean;
          signer_is_primary_signer: boolean;
          signer_order: number;
          signer_team_department_id: string | null;
          signer_team_member_id: string;
          signer_team_project_id: string | null;
        };
        Insert: {
          signer_action: string;
          signer_form_id: string;
          signer_id?: string;
          signer_is_disabled?: boolean;
          signer_is_primary_signer?: boolean;
          signer_order: number;
          signer_team_department_id?: string | null;
          signer_team_member_id: string;
          signer_team_project_id?: string | null;
        };
        Update: {
          signer_action?: string;
          signer_form_id?: string;
          signer_id?: string;
          signer_is_disabled?: boolean;
          signer_is_primary_signer?: boolean;
          signer_order?: number;
          signer_team_department_id?: string | null;
          signer_team_member_id?: string;
          signer_team_project_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "signer_table_signer_form_id_fkey";
            columns: ["signer_form_id"];
            isOneToOne: false;
            referencedRelation: "form_table";
            referencedColumns: ["form_id"];
          },
        ];
      };
      special_field_template_table: {
        Row: {
          special_field_template_description: string | null;
          special_field_template_id: string;
          special_field_template_name: string;
          special_field_template_type: string;
        };
        Insert: {
          special_field_template_description?: string | null;
          special_field_template_id?: string;
          special_field_template_name: string;
          special_field_template_type: string;
        };
        Update: {
          special_field_template_description?: string | null;
          special_field_template_id?: string;
          special_field_template_name?: string;
          special_field_template_type?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  history_schema: {
    Tables: {
      signature_history_table: {
        Row: {
          signature_history_date_created: string;
          signature_history_id: string;
          signature_history_user_id: string;
          signature_history_value: string;
        };
        Insert: {
          signature_history_date_created?: string;
          signature_history_id?: string;
          signature_history_user_id: string;
          signature_history_value: string;
        };
        Update: {
          signature_history_date_created?: string;
          signature_history_id?: string;
          signature_history_user_id?: string;
          signature_history_value?: string;
        };
        Relationships: [];
      };
      user_name_history_table: {
        Row: {
          user_name_history_date_created: string;
          user_name_history_id: string;
          user_name_history_user_id: string;
          user_name_history_value: string;
        };
        Insert: {
          user_name_history_date_created?: string;
          user_name_history_id?: string;
          user_name_history_user_id: string;
          user_name_history_value: string;
        };
        Update: {
          user_name_history_date_created?: string;
          user_name_history_id?: string;
          user_name_history_user_id?: string;
          user_name_history_value?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  hr_schema: {
    Tables: {
      background_check_table: {
        Row: {
          background_check_date_created: string;
          background_check_id: string;
          background_check_request_id: string;
          background_check_status: string;
          background_check_status_date_updated: string | null;
          background_check_team_member_id: string | null;
        };
        Insert: {
          background_check_date_created?: string;
          background_check_id?: string;
          background_check_request_id: string;
          background_check_status?: string;
          background_check_status_date_updated?: string | null;
          background_check_team_member_id?: string | null;
        };
        Update: {
          background_check_date_created?: string;
          background_check_id?: string;
          background_check_request_id?: string;
          background_check_status?: string;
          background_check_status_date_updated?: string | null;
          background_check_team_member_id?: string | null;
        };
        Relationships: [];
      };
      hr_phone_interview_table: {
        Row: {
          hr_phone_interview_date_created: string;
          hr_phone_interview_id: string;
          hr_phone_interview_request_id: string;
          hr_phone_interview_schedule: string | null;
          hr_phone_interview_status: string;
          hr_phone_interview_status_date_updated: string | null;
          hr_phone_interview_team_member_id: string | null;
        };
        Insert: {
          hr_phone_interview_date_created?: string;
          hr_phone_interview_id?: string;
          hr_phone_interview_request_id: string;
          hr_phone_interview_schedule?: string | null;
          hr_phone_interview_status?: string;
          hr_phone_interview_status_date_updated?: string | null;
          hr_phone_interview_team_member_id?: string | null;
        };
        Update: {
          hr_phone_interview_date_created?: string;
          hr_phone_interview_id?: string;
          hr_phone_interview_request_id?: string;
          hr_phone_interview_schedule?: string | null;
          hr_phone_interview_status?: string;
          hr_phone_interview_status_date_updated?: string | null;
          hr_phone_interview_team_member_id?: string | null;
        };
        Relationships: [];
      };
      hr_project_table: {
        Row: {
          hr_project_address_id: string;
          hr_project_date_created: string;
          hr_project_id: string;
          hr_project_name: string;
        };
        Insert: {
          hr_project_address_id: string;
          hr_project_date_created?: string;
          hr_project_id?: string;
          hr_project_name: string;
        };
        Update: {
          hr_project_address_id?: string;
          hr_project_date_created?: string;
          hr_project_id?: string;
          hr_project_name?: string;
        };
        Relationships: [];
      };
      interview_online_meeting_table: {
        Row: {
          interview_meeting_break_duration: number;
          interview_meeting_date_created: string;
          interview_meeting_duration: number;
          interview_meeting_id: string;
          interview_meeting_interview_id: string;
          interview_meeting_is_disabled: boolean;
          interview_meeting_provider_id: string | null;
          interview_meeting_schedule: string;
          interview_meeting_url: string;
        };
        Insert: {
          interview_meeting_break_duration: number;
          interview_meeting_date_created?: string;
          interview_meeting_duration: number;
          interview_meeting_id?: string;
          interview_meeting_interview_id: string;
          interview_meeting_is_disabled?: boolean;
          interview_meeting_provider_id?: string | null;
          interview_meeting_schedule: string;
          interview_meeting_url: string;
        };
        Update: {
          interview_meeting_break_duration?: number;
          interview_meeting_date_created?: string;
          interview_meeting_duration?: number;
          interview_meeting_id?: string;
          interview_meeting_interview_id?: string;
          interview_meeting_is_disabled?: boolean;
          interview_meeting_provider_id?: string | null;
          interview_meeting_schedule?: string;
          interview_meeting_url?: string;
        };
        Relationships: [];
      };
      job_offer_reason_for_rejection_table: {
        Row: {
          job_offer_reason_for_rejection: string;
          job_offer_reason_for_rejection_id: string;
          job_offer_reason_for_rejection_job_offer_id: string;
        };
        Insert: {
          job_offer_reason_for_rejection: string;
          job_offer_reason_for_rejection_id?: string;
          job_offer_reason_for_rejection_job_offer_id: string;
        };
        Update: {
          job_offer_reason_for_rejection?: string;
          job_offer_reason_for_rejection_id?: string;
          job_offer_reason_for_rejection_job_offer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_offer_reason_for_rejectio_job_offer_reason_for_rejecti_fkey";
            columns: ["job_offer_reason_for_rejection_job_offer_id"];
            isOneToOne: false;
            referencedRelation: "job_offer_table";
            referencedColumns: ["job_offer_id"];
          },
        ];
      };
      job_offer_table: {
        Row: {
          job_offer_attachment_id: string | null;
          job_offer_compensation: string | null;
          job_offer_date_created: string;
          job_offer_id: string;
          job_offer_manpower_loading_id: string | null;
          job_offer_manpower_loading_reference_created_by: string | null;
          job_offer_project_assignment: string | null;
          job_offer_project_assignment_address: string | null;
          job_offer_project_latitude: string | null;
          job_offer_project_longitude: string | null;
          job_offer_request_id: string;
          job_offer_status: string;
          job_offer_team_member_id: string | null;
          job_offer_title: string | null;
        };
        Insert: {
          job_offer_attachment_id?: string | null;
          job_offer_compensation?: string | null;
          job_offer_date_created?: string;
          job_offer_id?: string;
          job_offer_manpower_loading_id?: string | null;
          job_offer_manpower_loading_reference_created_by?: string | null;
          job_offer_project_assignment?: string | null;
          job_offer_project_assignment_address?: string | null;
          job_offer_project_latitude?: string | null;
          job_offer_project_longitude?: string | null;
          job_offer_request_id: string;
          job_offer_status?: string;
          job_offer_team_member_id?: string | null;
          job_offer_title?: string | null;
        };
        Update: {
          job_offer_attachment_id?: string | null;
          job_offer_compensation?: string | null;
          job_offer_date_created?: string;
          job_offer_id?: string;
          job_offer_manpower_loading_id?: string | null;
          job_offer_manpower_loading_reference_created_by?: string | null;
          job_offer_project_assignment?: string | null;
          job_offer_project_assignment_address?: string | null;
          job_offer_project_latitude?: string | null;
          job_offer_project_longitude?: string | null;
          job_offer_request_id?: string;
          job_offer_status?: string;
          job_offer_team_member_id?: string | null;
          job_offer_title?: string | null;
        };
        Relationships: [];
      };
      recruitment_table: {
        Row: {
          recruitment_id: string;
          recruitment_request_id: string;
          recruitment_team_member_id: string;
        };
        Insert: {
          recruitment_id?: string;
          recruitment_request_id: string;
          recruitment_team_member_id: string;
        };
        Update: {
          recruitment_id?: string;
          recruitment_request_id?: string;
          recruitment_team_member_id?: string;
        };
        Relationships: [];
      };
      request_connection_table: {
        Row: {
          request_connection_application_information_request_id: string;
          request_connection_general_assessment_request_id: string | null;
          request_connection_id: string;
          request_connection_technical_assessment_request_id: string | null;
        };
        Insert: {
          request_connection_application_information_request_id: string;
          request_connection_general_assessment_request_id?: string | null;
          request_connection_id?: string;
          request_connection_technical_assessment_request_id?: string | null;
        };
        Update: {
          request_connection_application_information_request_id?: string;
          request_connection_general_assessment_request_id?: string | null;
          request_connection_id?: string;
          request_connection_technical_assessment_request_id?: string | null;
        };
        Relationships: [];
      };
      technical_interview_table: {
        Row: {
          technical_interview_date_created: string;
          technical_interview_id: string;
          technical_interview_meeting_link: string | null;
          technical_interview_number: number;
          technical_interview_request_id: string;
          technical_interview_schedule: string | null;
          technical_interview_status: string;
          technical_interview_status_date_updated: string | null;
          technical_interview_team_member_id: string | null;
        };
        Insert: {
          technical_interview_date_created?: string;
          technical_interview_id?: string;
          technical_interview_meeting_link?: string | null;
          technical_interview_number?: number;
          technical_interview_request_id: string;
          technical_interview_schedule?: string | null;
          technical_interview_status?: string;
          technical_interview_status_date_updated?: string | null;
          technical_interview_team_member_id?: string | null;
        };
        Update: {
          technical_interview_date_created?: string;
          technical_interview_id?: string;
          technical_interview_meeting_link?: string | null;
          technical_interview_number?: number;
          technical_interview_request_id?: string;
          technical_interview_schedule?: string | null;
          technical_interview_status?: string;
          technical_interview_status_date_updated?: string | null;
          technical_interview_team_member_id?: string | null;
        };
        Relationships: [];
      };
      trade_test_table: {
        Row: {
          trade_test_address_id: string | null;
          trade_test_date_created: string;
          trade_test_id: string;
          trade_test_meeting_link: string | null;
          trade_test_request_id: string;
          trade_test_schedule: string | null;
          trade_test_status: string;
          trade_test_status_date_updated: string | null;
          trade_test_team_member_id: string | null;
        };
        Insert: {
          trade_test_address_id?: string | null;
          trade_test_date_created?: string;
          trade_test_id?: string;
          trade_test_meeting_link?: string | null;
          trade_test_request_id: string;
          trade_test_schedule?: string | null;
          trade_test_status?: string;
          trade_test_status_date_updated?: string | null;
          trade_test_team_member_id?: string | null;
        };
        Update: {
          trade_test_address_id?: string | null;
          trade_test_date_created?: string;
          trade_test_id?: string;
          trade_test_meeting_link?: string | null;
          trade_test_request_id?: string;
          trade_test_schedule?: string | null;
          trade_test_status?: string;
          trade_test_status_date_updated?: string | null;
          trade_test_team_member_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  item_schema: {
    Tables: {
      item_category_table: {
        Row: {
          item_category: string;
          item_category_date_created: string;
          item_category_id: string;
          item_category_is_available: boolean;
          item_category_is_disabled: boolean;
          item_category_signer_id: string;
        };
        Insert: {
          item_category: string;
          item_category_date_created?: string;
          item_category_id?: string;
          item_category_is_available?: boolean;
          item_category_is_disabled?: boolean;
          item_category_signer_id: string;
        };
        Update: {
          item_category?: string;
          item_category_date_created?: string;
          item_category_id?: string;
          item_category_is_available?: boolean;
          item_category_is_disabled?: boolean;
          item_category_signer_id?: string;
        };
        Relationships: [];
      };
      item_description_field_table: {
        Row: {
          item_description_field_date_created: string;
          item_description_field_id: string;
          item_description_field_is_available: boolean;
          item_description_field_is_disabled: boolean;
          item_description_field_item_description_id: string;
          item_description_field_value: string;
        };
        Insert: {
          item_description_field_date_created?: string;
          item_description_field_id?: string;
          item_description_field_is_available?: boolean;
          item_description_field_is_disabled?: boolean;
          item_description_field_item_description_id: string;
          item_description_field_value: string;
        };
        Update: {
          item_description_field_date_created?: string;
          item_description_field_id?: string;
          item_description_field_is_available?: boolean;
          item_description_field_is_disabled?: boolean;
          item_description_field_item_description_id?: string;
          item_description_field_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_description_field_table_item_description_field_item_d_fkey";
            columns: ["item_description_field_item_description_id"];
            isOneToOne: false;
            referencedRelation: "item_description_table";
            referencedColumns: ["item_description_id"];
          },
        ];
      };
      item_description_field_uom_table: {
        Row: {
          item_description_field_uom: string;
          item_description_field_uom_id: string;
          item_description_field_uom_item_description_field_id: string;
        };
        Insert: {
          item_description_field_uom: string;
          item_description_field_uom_id?: string;
          item_description_field_uom_item_description_field_id: string;
        };
        Update: {
          item_description_field_uom?: string;
          item_description_field_uom_id?: string;
          item_description_field_uom_item_description_field_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_description_field_uom_ta_item_description_field_uom_i_fkey";
            columns: ["item_description_field_uom_item_description_field_id"];
            isOneToOne: false;
            referencedRelation: "item_description_field_table";
            referencedColumns: ["item_description_field_id"];
          },
        ];
      };
      item_description_table: {
        Row: {
          item_description_date_created: string;
          item_description_field_id: string;
          item_description_id: string;
          item_description_is_available: boolean;
          item_description_is_disabled: boolean;
          item_description_is_with_uom: boolean;
          item_description_item_id: string;
          item_description_label: string;
          item_description_order: number;
        };
        Insert: {
          item_description_date_created?: string;
          item_description_field_id: string;
          item_description_id?: string;
          item_description_is_available?: boolean;
          item_description_is_disabled?: boolean;
          item_description_is_with_uom?: boolean;
          item_description_item_id: string;
          item_description_label: string;
          item_description_order: number;
        };
        Update: {
          item_description_date_created?: string;
          item_description_field_id?: string;
          item_description_id?: string;
          item_description_is_available?: boolean;
          item_description_is_disabled?: boolean;
          item_description_is_with_uom?: boolean;
          item_description_item_id?: string;
          item_description_label?: string;
          item_description_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "item_description_table_item_description_item_id_fkey";
            columns: ["item_description_item_id"];
            isOneToOne: false;
            referencedRelation: "item_table";
            referencedColumns: ["item_id"];
          },
        ];
      };
      item_division_table: {
        Row: {
          item_division_id: string;
          item_division_item_id: string;
          item_division_value: string;
        };
        Insert: {
          item_division_id?: string;
          item_division_item_id: string;
          item_division_value: string;
        };
        Update: {
          item_division_id?: string;
          item_division_item_id?: string;
          item_division_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_division_table_item_division_item_id_fkey";
            columns: ["item_division_item_id"];
            isOneToOne: false;
            referencedRelation: "item_table";
            referencedColumns: ["item_id"];
          },
        ];
      };
      item_level_three_description_table: {
        Row: {
          item_level_three_description: string;
          item_level_three_description_date_created: string;
          item_level_three_description_id: string;
          item_level_three_description_item_id: string | null;
        };
        Insert: {
          item_level_three_description: string;
          item_level_three_description_date_created?: string;
          item_level_three_description_id?: string;
          item_level_three_description_item_id?: string | null;
        };
        Update: {
          item_level_three_description?: string;
          item_level_three_description_date_created?: string;
          item_level_three_description_id?: string;
          item_level_three_description_item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "item_level_three_description__item_level_three_description_fkey";
            columns: ["item_level_three_description_item_id"];
            isOneToOne: false;
            referencedRelation: "item_table";
            referencedColumns: ["item_id"];
          },
        ];
      };
      item_table: {
        Row: {
          item_category_id: string | null;
          item_date_created: string;
          item_general_name: string;
          item_gl_account: string;
          item_id: string;
          item_is_available: boolean;
          item_is_disabled: boolean;
          item_is_it_asset_item: boolean;
          item_is_ped_item: boolean;
          item_team_id: string;
          item_unit: string;
        };
        Insert: {
          item_category_id?: string | null;
          item_date_created?: string;
          item_general_name: string;
          item_gl_account: string;
          item_id?: string;
          item_is_available?: boolean;
          item_is_disabled?: boolean;
          item_is_it_asset_item?: boolean;
          item_is_ped_item?: boolean;
          item_team_id: string;
          item_unit: string;
        };
        Update: {
          item_category_id?: string | null;
          item_date_created?: string;
          item_general_name?: string;
          item_gl_account?: string;
          item_id?: string;
          item_is_available?: boolean;
          item_is_disabled?: boolean;
          item_is_it_asset_item?: boolean;
          item_is_ped_item?: boolean;
          item_team_id?: string;
          item_unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_table_item_category_id_fkey";
            columns: ["item_category_id"];
            isOneToOne: false;
            referencedRelation: "item_category_table";
            referencedColumns: ["item_category_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  jira_schema: {
    Tables: {
      jira_formsly_project_table: {
        Row: {
          formsly_project_id: string;
          jira_formsly_project_id: string;
          jira_project_id: string;
        };
        Insert: {
          formsly_project_id: string;
          jira_formsly_project_id?: string;
          jira_project_id: string;
        };
        Update: {
          formsly_project_id?: string;
          jira_formsly_project_id?: string;
          jira_project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jira_formsly_project_table_jira_project_id_fkey";
            columns: ["jira_project_id"];
            isOneToOne: false;
            referencedRelation: "jira_project_table";
            referencedColumns: ["jira_project_id"];
          },
        ];
      };
      jira_item_category_table: {
        Row: {
          jira_item_category_formsly_label: string;
          jira_item_category_id: string;
          jira_item_category_jira_id: string;
          jira_item_category_jira_label: string;
        };
        Insert: {
          jira_item_category_formsly_label: string;
          jira_item_category_id?: string;
          jira_item_category_jira_id: string;
          jira_item_category_jira_label: string;
        };
        Update: {
          jira_item_category_formsly_label?: string;
          jira_item_category_id?: string;
          jira_item_category_jira_id?: string;
          jira_item_category_jira_label?: string;
        };
        Relationships: [];
      };
      jira_item_user_table: {
        Row: {
          jira_item_user_account_id: string;
          jira_item_user_id: string;
          jira_item_user_item_category_id: string;
          jira_item_user_role_id: string;
        };
        Insert: {
          jira_item_user_account_id: string;
          jira_item_user_id?: string;
          jira_item_user_item_category_id: string;
          jira_item_user_role_id: string;
        };
        Update: {
          jira_item_user_account_id?: string;
          jira_item_user_id?: string;
          jira_item_user_item_category_id?: string;
          jira_item_user_role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jira_item_user_table_jira_item_user_account_id_fkey";
            columns: ["jira_item_user_account_id"];
            isOneToOne: false;
            referencedRelation: "jira_user_account_table";
            referencedColumns: ["jira_user_account_id"];
          },
          {
            foreignKeyName: "jira_item_user_table_jira_item_user_item_category_id_fkey";
            columns: ["jira_item_user_item_category_id"];
            isOneToOne: false;
            referencedRelation: "jira_item_category_table";
            referencedColumns: ["jira_item_category_id"];
          },
          {
            foreignKeyName: "jira_item_user_table_jira_item_user_role_id_fkey";
            columns: ["jira_item_user_role_id"];
            isOneToOne: false;
            referencedRelation: "jira_user_role_table";
            referencedColumns: ["jira_user_role_id"];
          },
        ];
      };
      jira_organization_table: {
        Row: {
          jira_organization_id: string;
          jira_organization_jira_id: string;
          jira_organization_jira_label: string;
        };
        Insert: {
          jira_organization_id?: string;
          jira_organization_jira_id: string;
          jira_organization_jira_label: string;
        };
        Update: {
          jira_organization_id?: string;
          jira_organization_jira_id?: string;
          jira_organization_jira_label?: string;
        };
        Relationships: [];
      };
      jira_organization_team_project_table: {
        Row: {
          jira_organization_team_project_id: string;
          jira_organization_team_project_organization_id: string;
          jira_organization_team_project_project_id: string;
        };
        Insert: {
          jira_organization_team_project_id?: string;
          jira_organization_team_project_organization_id: string;
          jira_organization_team_project_project_id: string;
        };
        Update: {
          jira_organization_team_project_id?: string;
          jira_organization_team_project_organization_id?: string;
          jira_organization_team_project_project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jira_organization_team_proje_jira_organization_team_proje_fkey1";
            columns: ["jira_organization_team_project_organization_id"];
            isOneToOne: false;
            referencedRelation: "jira_organization_table";
            referencedColumns: ["jira_organization_id"];
          },
        ];
      };
      jira_project_table: {
        Row: {
          jira_project_id: string;
          jira_project_jira_id: string;
          jira_project_jira_label: string;
        };
        Insert: {
          jira_project_id?: string;
          jira_project_jira_id: string;
          jira_project_jira_label: string;
        };
        Update: {
          jira_project_id?: string;
          jira_project_jira_id?: string;
          jira_project_jira_label?: string;
        };
        Relationships: [];
      };
      jira_project_user_table: {
        Row: {
          jira_project_user_account_id: string;
          jira_project_user_id: string;
          jira_project_user_role_id: string;
          jira_project_user_team_project_id: string;
        };
        Insert: {
          jira_project_user_account_id: string;
          jira_project_user_id?: string;
          jira_project_user_role_id: string;
          jira_project_user_team_project_id: string;
        };
        Update: {
          jira_project_user_account_id?: string;
          jira_project_user_id?: string;
          jira_project_user_role_id?: string;
          jira_project_user_team_project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jira_project_user_table_jira_project_user_account_id_fkey";
            columns: ["jira_project_user_account_id"];
            isOneToOne: false;
            referencedRelation: "jira_user_account_table";
            referencedColumns: ["jira_user_account_id"];
          },
          {
            foreignKeyName: "jira_project_user_table_jira_project_user_role_id_fkey";
            columns: ["jira_project_user_role_id"];
            isOneToOne: false;
            referencedRelation: "jira_user_role_table";
            referencedColumns: ["jira_user_role_id"];
          },
        ];
      };
      jira_user_account_table: {
        Row: {
          jira_user_account_date_created: string;
          jira_user_account_date_updated: string | null;
          jira_user_account_display_name: string;
          jira_user_account_email_address: string;
          jira_user_account_id: string;
          jira_user_account_jira_id: string;
        };
        Insert: {
          jira_user_account_date_created?: string;
          jira_user_account_date_updated?: string | null;
          jira_user_account_display_name: string;
          jira_user_account_email_address: string;
          jira_user_account_id?: string;
          jira_user_account_jira_id: string;
        };
        Update: {
          jira_user_account_date_created?: string;
          jira_user_account_date_updated?: string | null;
          jira_user_account_display_name?: string;
          jira_user_account_email_address?: string;
          jira_user_account_id?: string;
          jira_user_account_jira_id?: string;
        };
        Relationships: [];
      };
      jira_user_role_table: {
        Row: {
          jira_user_role_date_created: string;
          jira_user_role_date_updated: string | null;
          jira_user_role_id: string;
          jira_user_role_label: string;
        };
        Insert: {
          jira_user_role_date_created?: string;
          jira_user_role_date_updated?: string | null;
          jira_user_role_id?: string;
          jira_user_role_label: string;
        };
        Update: {
          jira_user_role_date_created?: string;
          jira_user_role_date_updated?: string | null;
          jira_user_role_id?: string;
          jira_user_role_label?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  lookup_schema: {
    Tables: {
      ad_owner_request_table: {
        Row: {
          ad_owner_request_id: string;
          ad_owner_request_owner_id: string;
          ad_owner_request_request_id: string;
        };
        Insert: {
          ad_owner_request_id?: string;
          ad_owner_request_owner_id: string;
          ad_owner_request_request_id: string;
        };
        Update: {
          ad_owner_request_id?: string;
          ad_owner_request_owner_id?: string;
          ad_owner_request_request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_owner_request_table_ad_owner_request_owner_id_fkey";
            columns: ["ad_owner_request_owner_id"];
            isOneToOne: false;
            referencedRelation: "ad_owner_table";
            referencedColumns: ["ad_owner_id"];
          },
        ];
      };
      ad_owner_table: {
        Row: {
          ad_owner_date_created: string;
          ad_owner_id: string;
          ad_owner_is_disabled: boolean;
          ad_owner_name: string;
        };
        Insert: {
          ad_owner_date_created?: string;
          ad_owner_id?: string;
          ad_owner_is_disabled?: boolean;
          ad_owner_name: string;
        };
        Update: {
          ad_owner_date_created?: string;
          ad_owner_id?: string;
          ad_owner_is_disabled?: boolean;
          ad_owner_name?: string;
        };
        Relationships: [];
      };
      bank_list_table: {
        Row: {
          bank_id: string;
          bank_label: string;
        };
        Insert: {
          bank_id?: string;
          bank_label: string;
        };
        Update: {
          bank_id?: string;
          bank_label?: string;
        };
        Relationships: [];
      };
      csi_code_table: {
        Row: {
          csi_code_division_description: string;
          csi_code_division_id: string;
          csi_code_id: string;
          csi_code_level_three_description: string;
          csi_code_level_three_id: string;
          csi_code_level_two_major_group_description: string;
          csi_code_level_two_major_group_id: string;
          csi_code_level_two_minor_group_description: string;
          csi_code_level_two_minor_group_id: string;
          csi_code_section: string;
        };
        Insert: {
          csi_code_division_description: string;
          csi_code_division_id: string;
          csi_code_id?: string;
          csi_code_level_three_description: string;
          csi_code_level_three_id: string;
          csi_code_level_two_major_group_description: string;
          csi_code_level_two_major_group_id: string;
          csi_code_level_two_minor_group_description: string;
          csi_code_level_two_minor_group_id: string;
          csi_code_section: string;
        };
        Update: {
          csi_code_division_description?: string;
          csi_code_division_id?: string;
          csi_code_id?: string;
          csi_code_level_three_description?: string;
          csi_code_level_three_id?: string;
          csi_code_level_two_major_group_description?: string;
          csi_code_level_two_major_group_id?: string;
          csi_code_level_two_minor_group_description?: string;
          csi_code_level_two_minor_group_id?: string;
          csi_code_section?: string;
        };
        Relationships: [];
      };
      currency_table: {
        Row: {
          currency_alphabetic_code: string;
          currency_entity: string;
          currency_id: string;
          currency_label: string;
          currency_numeric_code: string;
        };
        Insert: {
          currency_alphabetic_code: string;
          currency_entity: string;
          currency_id?: string;
          currency_label: string;
          currency_numeric_code: string;
        };
        Update: {
          currency_alphabetic_code?: string;
          currency_entity?: string;
          currency_id?: string;
          currency_label?: string;
          currency_numeric_code?: string;
        };
        Relationships: [];
      };
      degree_table: {
        Row: {
          degree_branch: string;
          degree_field_of_study: string | null;
          degree_id: string;
          degree_name: string;
          degree_type: string;
        };
        Insert: {
          degree_branch: string;
          degree_field_of_study?: string | null;
          degree_id?: string;
          degree_name: string;
          degree_type: string;
        };
        Update: {
          degree_branch?: string;
          degree_field_of_study?: string | null;
          degree_id?: string;
          degree_name?: string;
          degree_type?: string;
        };
        Relationships: [];
      };
      employee_job_title_table: {
        Row: {
          employee_job_title_date_created: string;
          employee_job_title_id: string;
          employee_job_title_is_disabled: boolean;
          employee_job_title_label: string;
        };
        Insert: {
          employee_job_title_date_created?: string;
          employee_job_title_id?: string;
          employee_job_title_is_disabled?: boolean;
          employee_job_title_label: string;
        };
        Update: {
          employee_job_title_date_created?: string;
          employee_job_title_id?: string;
          employee_job_title_is_disabled?: boolean;
          employee_job_title_label?: string;
        };
        Relationships: [];
      };
      formsly_price_table: {
        Row: {
          formsly_price: number;
          formsly_price_date_created: string;
          formsly_price_id: string;
        };
        Insert: {
          formsly_price: number;
          formsly_price_date_created?: string;
          formsly_price_id?: string;
        };
        Update: {
          formsly_price?: number;
          formsly_price_date_created?: string;
          formsly_price_id?: string;
        };
        Relationships: [];
      };
      position_table: {
        Row: {
          position_alias: string;
          position_category: string;
          position_certificate_label: string | null;
          position_classification: string;
          position_date_created: string;
          position_department: string | null;
          position_department_function: string | null;
          position_function: string | null;
          position_id: string;
          position_is_available: boolean;
          position_is_disabled: boolean;
          position_is_ped_position: boolean;
          position_is_with_background_check: boolean;
          position_is_with_certificate: boolean;
          position_is_with_license: boolean;
          position_is_with_technical_interview_1: boolean;
          position_is_with_technical_interview_2: boolean;
          position_is_with_trade_test: boolean;
          position_license_label: string | null;
          position_minimum_years_of_experience: number;
          position_questionnaire_id: string | null;
          position_seniority: string;
          position_team_id: string;
          position_title: string;
          position_title_type: string | null;
        };
        Insert: {
          position_alias: string;
          position_category: string;
          position_certificate_label?: string | null;
          position_classification: string;
          position_date_created?: string;
          position_department?: string | null;
          position_department_function?: string | null;
          position_function?: string | null;
          position_id?: string;
          position_is_available?: boolean;
          position_is_disabled?: boolean;
          position_is_ped_position?: boolean;
          position_is_with_background_check?: boolean;
          position_is_with_certificate?: boolean;
          position_is_with_license?: boolean;
          position_is_with_technical_interview_1?: boolean;
          position_is_with_technical_interview_2?: boolean;
          position_is_with_trade_test?: boolean;
          position_license_label?: string | null;
          position_minimum_years_of_experience?: number;
          position_questionnaire_id?: string | null;
          position_seniority: string;
          position_team_id: string;
          position_title: string;
          position_title_type?: string | null;
        };
        Update: {
          position_alias?: string;
          position_category?: string;
          position_certificate_label?: string | null;
          position_classification?: string;
          position_date_created?: string;
          position_department?: string | null;
          position_department_function?: string | null;
          position_function?: string | null;
          position_id?: string;
          position_is_available?: boolean;
          position_is_disabled?: boolean;
          position_is_ped_position?: boolean;
          position_is_with_background_check?: boolean;
          position_is_with_certificate?: boolean;
          position_is_with_license?: boolean;
          position_is_with_technical_interview_1?: boolean;
          position_is_with_technical_interview_2?: boolean;
          position_is_with_trade_test?: boolean;
          position_license_label?: string | null;
          position_minimum_years_of_experience?: number;
          position_questionnaire_id?: string | null;
          position_seniority?: string;
          position_team_id?: string;
          position_title?: string;
          position_title_type?: string | null;
        };
        Relationships: [];
      };
      query_table: {
        Row: {
          query_id: string;
          query_name: string;
          query_sql: string;
        };
        Insert: {
          query_id?: string;
          query_name: string;
          query_sql: string;
        };
        Update: {
          query_id?: string;
          query_name?: string;
          query_sql?: string;
        };
        Relationships: [];
      };
      scic_employee_table: {
        Row: {
          scic_employee_date_created: string;
          scic_employee_first_name: string;
          scic_employee_hris_id_number: string;
          scic_employee_id: string;
          scic_employee_last_name: string;
          scic_employee_middle_name: string | null;
          scic_employee_suffix: string | null;
        };
        Insert: {
          scic_employee_date_created?: string;
          scic_employee_first_name: string;
          scic_employee_hris_id_number: string;
          scic_employee_id?: string;
          scic_employee_last_name: string;
          scic_employee_middle_name?: string | null;
          scic_employee_suffix?: string | null;
        };
        Update: {
          scic_employee_date_created?: string;
          scic_employee_first_name?: string;
          scic_employee_hris_id_number?: string;
          scic_employee_id?: string;
          scic_employee_last_name?: string;
          scic_employee_middle_name?: string | null;
          scic_employee_suffix?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  memo_schema: {
    Tables: {
      memo_agreement_table: {
        Row: {
          memo_agreement_by_team_member_id: string;
          memo_agreement_date_created: string;
          memo_agreement_id: string;
          memo_agreement_memo_id: string;
        };
        Insert: {
          memo_agreement_by_team_member_id: string;
          memo_agreement_date_created?: string;
          memo_agreement_id?: string;
          memo_agreement_memo_id: string;
        };
        Update: {
          memo_agreement_by_team_member_id?: string;
          memo_agreement_date_created?: string;
          memo_agreement_id?: string;
          memo_agreement_memo_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memo_agreement_table_memo_agreement_memo_id_fkey";
            columns: ["memo_agreement_memo_id"];
            isOneToOne: false;
            referencedRelation: "memo_table";
            referencedColumns: ["memo_id"];
          },
        ];
      };
      memo_date_updated_table: {
        Row: {
          memo_date_updated: string;
          memo_date_updated_id: string;
          memo_date_updated_memo_id: string;
        };
        Insert: {
          memo_date_updated?: string;
          memo_date_updated_id?: string;
          memo_date_updated_memo_id: string;
        };
        Update: {
          memo_date_updated?: string;
          memo_date_updated_id?: string;
          memo_date_updated_memo_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memo_date_updated_table_memo_date_updated_memo_id_fkey";
            columns: ["memo_date_updated_memo_id"];
            isOneToOne: false;
            referencedRelation: "memo_table";
            referencedColumns: ["memo_id"];
          },
        ];
      };
      memo_format_attachment_table: {
        Row: {
          memo_format_attachment_id: string;
          memo_format_attachment_name: string;
          memo_format_attachment_order: string;
          memo_format_attachment_subsection_id: string | null;
          memo_format_attachment_url: string;
        };
        Insert: {
          memo_format_attachment_id?: string;
          memo_format_attachment_name: string;
          memo_format_attachment_order: string;
          memo_format_attachment_subsection_id?: string | null;
          memo_format_attachment_url: string;
        };
        Update: {
          memo_format_attachment_id?: string;
          memo_format_attachment_name?: string;
          memo_format_attachment_order?: string;
          memo_format_attachment_subsection_id?: string | null;
          memo_format_attachment_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memo_format_attachment_table_memo_format_attachment_subsec_fkey";
            columns: ["memo_format_attachment_subsection_id"];
            isOneToOne: false;
            referencedRelation: "memo_format_subsection_table";
            referencedColumns: ["memo_format_subsection_id"];
          },
        ];
      };
      memo_format_section_table: {
        Row: {
          memo_format_section_id: string;
          memo_format_section_margin_bottom: string | null;
          memo_format_section_margin_left: string | null;
          memo_format_section_margin_right: string | null;
          memo_format_section_margin_top: string | null;
          memo_format_section_name: string | null;
        };
        Insert: {
          memo_format_section_id?: string;
          memo_format_section_margin_bottom?: string | null;
          memo_format_section_margin_left?: string | null;
          memo_format_section_margin_right?: string | null;
          memo_format_section_margin_top?: string | null;
          memo_format_section_name?: string | null;
        };
        Update: {
          memo_format_section_id?: string;
          memo_format_section_margin_bottom?: string | null;
          memo_format_section_margin_left?: string | null;
          memo_format_section_margin_right?: string | null;
          memo_format_section_margin_top?: string | null;
          memo_format_section_name?: string | null;
        };
        Relationships: [];
      };
      memo_format_subsection_table: {
        Row: {
          memo_format_subsection_id: string;
          memo_format_subsection_name: string | null;
          memo_format_subsection_section_id: string | null;
          memo_format_subsection_text: string | null;
          memo_format_subsection_text_font_size: string | null;
        };
        Insert: {
          memo_format_subsection_id?: string;
          memo_format_subsection_name?: string | null;
          memo_format_subsection_section_id?: string | null;
          memo_format_subsection_text?: string | null;
          memo_format_subsection_text_font_size?: string | null;
        };
        Update: {
          memo_format_subsection_id?: string;
          memo_format_subsection_name?: string | null;
          memo_format_subsection_section_id?: string | null;
          memo_format_subsection_text?: string | null;
          memo_format_subsection_text_font_size?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "memo_format_subsection_table_memo_format_subsection_sectio_fkey";
            columns: ["memo_format_subsection_section_id"];
            isOneToOne: false;
            referencedRelation: "memo_format_section_table";
            referencedColumns: ["memo_format_section_id"];
          },
        ];
      };
      memo_line_item_attachment_table: {
        Row: {
          memo_line_item_attachment_caption: string | null;
          memo_line_item_attachment_id: string;
          memo_line_item_attachment_line_item_id: string;
          memo_line_item_attachment_name: string;
          memo_line_item_attachment_public_url: string;
          memo_line_item_attachment_storage_bucket: string;
        };
        Insert: {
          memo_line_item_attachment_caption?: string | null;
          memo_line_item_attachment_id?: string;
          memo_line_item_attachment_line_item_id: string;
          memo_line_item_attachment_name: string;
          memo_line_item_attachment_public_url: string;
          memo_line_item_attachment_storage_bucket: string;
        };
        Update: {
          memo_line_item_attachment_caption?: string | null;
          memo_line_item_attachment_id?: string;
          memo_line_item_attachment_line_item_id?: string;
          memo_line_item_attachment_name?: string;
          memo_line_item_attachment_public_url?: string;
          memo_line_item_attachment_storage_bucket?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memo_line_item_attachment_tab_memo_line_item_attachment_li_fkey";
            columns: ["memo_line_item_attachment_line_item_id"];
            isOneToOne: false;
            referencedRelation: "memo_line_item_table";
            referencedColumns: ["memo_line_item_id"];
          },
        ];
      };
      memo_line_item_table: {
        Row: {
          memo_line_item_content: string;
          memo_line_item_date_created: string;
          memo_line_item_date_updated: string | null;
          memo_line_item_id: string;
          memo_line_item_memo_id: string;
          memo_line_item_order: number;
        };
        Insert: {
          memo_line_item_content: string;
          memo_line_item_date_created?: string;
          memo_line_item_date_updated?: string | null;
          memo_line_item_id?: string;
          memo_line_item_memo_id: string;
          memo_line_item_order: number;
        };
        Update: {
          memo_line_item_content?: string;
          memo_line_item_date_created?: string;
          memo_line_item_date_updated?: string | null;
          memo_line_item_id?: string;
          memo_line_item_memo_id?: string;
          memo_line_item_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "memo_line_item_table_memo_line_item_memo_id_fkey";
            columns: ["memo_line_item_memo_id"];
            isOneToOne: false;
            referencedRelation: "memo_table";
            referencedColumns: ["memo_id"];
          },
        ];
      };
      memo_read_receipt_table: {
        Row: {
          memo_read_receipt_by_team_member_id: string;
          memo_read_receipt_date_created: string;
          memo_read_receipt_id: string;
          memo_read_receipt_memo_id: string;
        };
        Insert: {
          memo_read_receipt_by_team_member_id: string;
          memo_read_receipt_date_created?: string;
          memo_read_receipt_id?: string;
          memo_read_receipt_memo_id: string;
        };
        Update: {
          memo_read_receipt_by_team_member_id?: string;
          memo_read_receipt_date_created?: string;
          memo_read_receipt_id?: string;
          memo_read_receipt_memo_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memo_read_receipt_table_memo_read_receipt_memo_id_fkey";
            columns: ["memo_read_receipt_memo_id"];
            isOneToOne: false;
            referencedRelation: "memo_table";
            referencedColumns: ["memo_id"];
          },
        ];
      };
      memo_signer_table: {
        Row: {
          memo_signer_date_created: string;
          memo_signer_date_signed: string | null;
          memo_signer_id: string;
          memo_signer_is_primary: boolean;
          memo_signer_memo_id: string;
          memo_signer_order: number;
          memo_signer_status: string;
          memo_signer_team_member_id: string;
        };
        Insert: {
          memo_signer_date_created?: string;
          memo_signer_date_signed?: string | null;
          memo_signer_id?: string;
          memo_signer_is_primary?: boolean;
          memo_signer_memo_id: string;
          memo_signer_order: number;
          memo_signer_status?: string;
          memo_signer_team_member_id: string;
        };
        Update: {
          memo_signer_date_created?: string;
          memo_signer_date_signed?: string | null;
          memo_signer_id?: string;
          memo_signer_is_primary?: boolean;
          memo_signer_memo_id?: string;
          memo_signer_order?: number;
          memo_signer_status?: string;
          memo_signer_team_member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memo_signer_table_memo_signer_memo_id_fkey";
            columns: ["memo_signer_memo_id"];
            isOneToOne: false;
            referencedRelation: "memo_table";
            referencedColumns: ["memo_id"];
          },
        ];
      };
      memo_status_table: {
        Row: {
          memo_status: string;
          memo_status_date_updated: string | null;
          memo_status_id: string;
          memo_status_memo_id: string;
        };
        Insert: {
          memo_status?: string;
          memo_status_date_updated?: string | null;
          memo_status_id?: string;
          memo_status_memo_id: string;
        };
        Update: {
          memo_status?: string;
          memo_status_date_updated?: string | null;
          memo_status_id?: string;
          memo_status_memo_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memo_status_table_memo_status_memo_id_fkey";
            columns: ["memo_status_memo_id"];
            isOneToOne: false;
            referencedRelation: "memo_table";
            referencedColumns: ["memo_id"];
          },
        ];
      };
      memo_table: {
        Row: {
          memo_author_user_id: string;
          memo_date_created: string;
          memo_id: string;
          memo_is_disabled: boolean;
          memo_reference_number: string;
          memo_subject: string;
          memo_team_id: string;
          memo_version: string;
        };
        Insert: {
          memo_author_user_id: string;
          memo_date_created?: string;
          memo_id?: string;
          memo_is_disabled?: boolean;
          memo_reference_number?: string;
          memo_subject: string;
          memo_team_id: string;
          memo_version: string;
        };
        Update: {
          memo_author_user_id?: string;
          memo_date_created?: string;
          memo_id?: string;
          memo_is_disabled?: boolean;
          memo_reference_number?: string;
          memo_subject?: string;
          memo_team_id?: string;
          memo_version?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  other_expenses_schema: {
    Tables: {
      other_expenses_category_table: {
        Row: {
          other_expenses_category: string;
          other_expenses_category_date_created: string;
          other_expenses_category_id: string;
          other_expenses_category_is_available: boolean;
          other_expenses_category_is_disabled: boolean;
          other_expenses_category_team_id: string;
        };
        Insert: {
          other_expenses_category: string;
          other_expenses_category_date_created?: string;
          other_expenses_category_id?: string;
          other_expenses_category_is_available?: boolean;
          other_expenses_category_is_disabled?: boolean;
          other_expenses_category_team_id: string;
        };
        Update: {
          other_expenses_category?: string;
          other_expenses_category_date_created?: string;
          other_expenses_category_id?: string;
          other_expenses_category_is_available?: boolean;
          other_expenses_category_is_disabled?: boolean;
          other_expenses_category_team_id?: string;
        };
        Relationships: [];
      };
      other_expenses_type_table: {
        Row: {
          other_expenses_type: string;
          other_expenses_type_category_id: string | null;
          other_expenses_type_date_created: string;
          other_expenses_type_id: string;
          other_expenses_type_is_available: boolean;
          other_expenses_type_is_disabled: boolean;
        };
        Insert: {
          other_expenses_type: string;
          other_expenses_type_category_id?: string | null;
          other_expenses_type_date_created?: string;
          other_expenses_type_id?: string;
          other_expenses_type_is_available?: boolean;
          other_expenses_type_is_disabled?: boolean;
        };
        Update: {
          other_expenses_type?: string;
          other_expenses_type_category_id?: string | null;
          other_expenses_type_date_created?: string;
          other_expenses_type_id?: string;
          other_expenses_type_is_available?: boolean;
          other_expenses_type_is_disabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "other_expenses_type_table_other_expenses_type_category_id_fkey";
            columns: ["other_expenses_type_category_id"];
            isOneToOne: false;
            referencedRelation: "other_expenses_category_table";
            referencedColumns: ["other_expenses_category_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      address_table: {
        Row: {
          address_barangay: string;
          address_city: string;
          address_date_created: string;
          address_id: string;
          address_latitude: string | null;
          address_longitude: string | null;
          address_province: string;
          address_region: string;
          address_street: string;
          address_zip_code: string;
        };
        Insert: {
          address_barangay: string;
          address_city: string;
          address_date_created?: string;
          address_id?: string;
          address_latitude?: string | null;
          address_longitude?: string | null;
          address_province: string;
          address_region: string;
          address_street: string;
          address_zip_code: string;
        };
        Update: {
          address_barangay?: string;
          address_city?: string;
          address_date_created?: string;
          address_id?: string;
          address_latitude?: string | null;
          address_longitude?: string | null;
          address_province?: string;
          address_region?: string;
          address_street?: string;
          address_zip_code?: string;
        };
        Relationships: [];
      };
      attachment_table: {
        Row: {
          attachment_bucket: string;
          attachment_date_created: string;
          attachment_id: string;
          attachment_is_disabled: boolean;
          attachment_name: string;
          attachment_value: string;
        };
        Insert: {
          attachment_bucket: string;
          attachment_date_created?: string;
          attachment_id?: string;
          attachment_is_disabled?: boolean;
          attachment_name: string;
          attachment_value: string;
        };
        Update: {
          attachment_bucket?: string;
          attachment_date_created?: string;
          attachment_id?: string;
          attachment_is_disabled?: boolean;
          attachment_name?: string;
          attachment_value?: string;
        };
        Relationships: [];
      };
      error_table: {
        Row: {
          error_date_created: string;
          error_function: string;
          error_id: string;
          error_message: string;
          error_url: string;
          error_user_email: string | null;
          error_user_id: string | null;
        };
        Insert: {
          error_date_created?: string;
          error_function: string;
          error_id?: string;
          error_message: string;
          error_url: string;
          error_user_email?: string | null;
          error_user_id?: string | null;
        };
        Update: {
          error_date_created?: string;
          error_function?: string;
          error_id?: string;
          error_message?: string;
          error_url?: string;
          error_user_email?: string | null;
          error_user_id?: string | null;
        };
        Relationships: [];
      };
      notification_table: {
        Row: {
          notification_app: string;
          notification_content: string;
          notification_date_created: string;
          notification_id: string;
          notification_is_read: boolean;
          notification_redirect_url: string | null;
          notification_team_id: string | null;
          notification_type: string;
          notification_user_id: string;
        };
        Insert: {
          notification_app: string;
          notification_content: string;
          notification_date_created?: string;
          notification_id?: string;
          notification_is_read?: boolean;
          notification_redirect_url?: string | null;
          notification_team_id?: string | null;
          notification_type: string;
          notification_user_id: string;
        };
        Update: {
          notification_app?: string;
          notification_content?: string;
          notification_date_created?: string;
          notification_id?: string;
          notification_is_read?: boolean;
          notification_redirect_url?: string | null;
          notification_team_id?: string | null;
          notification_type?: string;
          notification_user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      distinct_division_view: {
        Row: {
          csi_code_division_description: string | null;
          csi_code_division_id: string | null;
        };
        Relationships: [];
      };
      request_view: {
        Row: {
          request_date_created: string | null;
          request_form_id: string | null;
          request_formsly_id: string | null;
          request_formsly_id_prefix: string | null;
          request_formsly_id_serial: string | null;
          request_id: string | null;
          request_is_disabled: boolean | null;
          request_jira_id: string | null;
          request_jira_link: string | null;
          request_otp_id: string | null;
          request_project_id: string | null;
          request_status: string | null;
          request_status_date_updated: string | null;
          request_team_member_id: string | null;
        };
        Insert: {
          request_date_created?: string | null;
          request_form_id?: string | null;
          request_formsly_id?: never;
          request_formsly_id_prefix?: string | null;
          request_formsly_id_serial?: string | null;
          request_id?: string | null;
          request_is_disabled?: boolean | null;
          request_jira_id?: string | null;
          request_jira_link?: string | null;
          request_otp_id?: string | null;
          request_project_id?: string | null;
          request_status?: string | null;
          request_status_date_updated?: string | null;
          request_team_member_id?: string | null;
        };
        Update: {
          request_date_created?: string | null;
          request_form_id?: string | null;
          request_formsly_id?: never;
          request_formsly_id_prefix?: string | null;
          request_formsly_id_serial?: string | null;
          request_id?: string | null;
          request_is_disabled?: boolean | null;
          request_jira_id?: string | null;
          request_jira_link?: string | null;
          request_otp_id?: string | null;
          request_project_id?: string | null;
          request_status?: string | null;
          request_status_date_updated?: string | null;
          request_team_member_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_team_invitation: {
        Args: {
          invitation_id: string;
          team_id: string;
          user_id: string;
        };
        Returns: Json;
      };
      add_job_offer: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      add_team_member_to_all_project: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      agree_to_memo: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      analyze_item: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      analyze_user_issued_item: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      application_information_next_step: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      approve_or_reject_memo: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      approve_or_reject_request: {
        Args: {
          input_data: Json;
        };
        Returns: string;
      };
      assign_ticket: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      build_form_page_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      cancel_request: {
        Args: {
          request_id: string;
          member_id: string;
          comment_type: string;
          comment_content: string;
        };
        Returns: undefined;
      };
      canvass_page_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_assessment_create_request_page: {
        Args: {
          input_data: Json;
        };
        Returns: boolean;
      };
      check_custom_csi_validity: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_if_all_primary_approver_approved_the_request: {
        Args: {
          input_data: Json;
        };
        Returns: boolean;
      };
      check_if_group_member: {
        Args: {
          input_data: Json;
        };
        Returns: boolean;
      };
      check_item_form_status: {
        Args: {
          team_id: string;
          form_id: string;
        };
        Returns: string;
      };
      check_item_quantity: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_job_offer_row: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_ped_part: {
        Args: {
          input_data: Json;
        };
        Returns: boolean;
      };
      check_rir_item_quantity: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_ro_item_quantity: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_spreadsheet_row_status: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_subcon_form_status: {
        Args: {
          team_id: string;
          form_id: string;
        };
        Returns: string;
      };
      check_technical_question: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_tranfer_receipt_item_quantity: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_technical_question_option: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      check_user_email: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_ad_owner_request: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      create_custom_csi: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_formsly_premade_forms: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      create_item: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_item_category: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      create_item_from_ticket_request: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      create_memo: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_ped_part_from_ticket_request: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      create_public_request_page_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_reference_memo: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_request: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_request_form: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_request_page_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_schedule: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_service: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_team_invitation: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_team_project: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_technical_question: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_ticket: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_user: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_user_valid_id: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      create_user_with_sss_id: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      delete_team: {
        Args: {
          team_id: string;
          team_member_id: string;
        };
        Returns: undefined;
      };
      edit_memo: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      edit_request: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      edit_ticket: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      event_status_update: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      fetch_dashboard_top_requestor: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_dashboard_top_signer: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_edit_request_section: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_form_section_with_multiple_duplicatable_section: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_item_request_conditional_options: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_other_expenses_request_conditional_options: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_ped_equipment_request_conditional_options: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_request_comment: {
        Args: {
          request_id: string;
        };
        Returns: Json;
      };
      fetch_request_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_request_page_section: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_service_request_conditional_options: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_ticket_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_user_request_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      fetch_user_request_list_data: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      form_list_page_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      form_page_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      format_team_name_to_url_key: {
        Args: {
          team_name: string;
        };
        Returns: string;
      };
      generate_request_id_condition: {
        Args: {
          request_id: string;
        };
        Returns: string;
      };
      get_active_group: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_admin_ticket_analytics: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_all_notification: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_all_team_members_without_group_members: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_all_team_members_without_project_members: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_application_information_analytics: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_application_information_summary_table: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_application_information_summary_table_columns: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_approver_request_count: {
        Args: {
          input_data: Json;
        };
        Returns: number;
      };
      get_approver_unresolved_request_count: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_asset_history: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_asset_spreadsheet_view: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_background_check_summary_table: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_child_asset: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_child_asset_option: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_column_fields: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_create_ticket_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_current_date: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_custom_field_details_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_degree_name_options: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_edit_request_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_email_resend_timer: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_equipment_part_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_field_of_study_options: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_form: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_form_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_form_list_with_filter: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_form_section_with_field_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_hr_indicator_count: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_hr_phone_interview_summary_table: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_hr_project_options: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_hr_spreadsheet_view_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_hr_with_lowest_load_within_a_week: {
        Args: {
          input_data: Json;
        };
        Returns: string;
      };
      get_incident_report: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_invitation: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_invitation_id: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_it_asset_raya_api: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_item: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_item_category_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_item_category_option: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_item_form_approver: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_item_option: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_item_raya_api: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_item_section_choices: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_item_unit_of_measurement: {
        Args: {
          input_data: Json;
        };
        Returns: string;
      };
      get_jira_automation_data: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_jira_formsly_project_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_job_history: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_job_offer_summary_table: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_lrf_summary_table: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_member_user: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_member_user_data: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_memo_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_memo_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_memo_reference_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_memo_signer_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_multiple_project_signer_with_team_member: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_notification_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_other_expenses_raya_api: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_ped_item_raya_api: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_ped_part_raya_api: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_phone_meeting_available: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_project_signer_with_team_member: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_query_data: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_question_field_order: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_questionnare_table_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_request: {
        Args: {
          request_id: string;
        };
        Returns: Json;
      };
      get_request_list_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_request_raya_api: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_request_status_count: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_request_status_monthly_count: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_request_team_id: {
        Args: {
          input_data: Json;
        };
        Returns: string;
      };
      get_request_total_count: {
        Args: {
          input_data: Json;
        };
        Returns: number;
      };
      get_request_without_duplicatable_section: {
        Args: {
          request_id: string;
        };
        Returns: Json;
      };
      get_security_group: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_services_raya_api: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_signer_sla: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_signer_with_profile: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_ssot: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_ssot_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_storage_upload_details: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_sub_field_options: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      get_sub_or_custom_field: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_admin_list_with_filter: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_approver_list_with_filter: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_group_member: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_group_member_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_invitation: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_member_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_member_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_member_with_filter: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_members_with_member_role: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_project_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_team_project_member_list: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_technical_interview_summary_table: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_technical_options: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_ticket_form: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_ticket_list_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_ticket_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_trade_test_summary_table: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_user_active_team_id: {
        Args: {
          user_id: string;
        };
        Returns: string;
      };
      get_user_application_progress_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_user_current_signature: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_user_id_in_application_information: {
        Args: {
          input_data: Json;
        };
        Returns: string;
      };
      get_user_id_in_application_information_v1: {
        Args: {
          input_data: Json;
        };
        Returns: string;
      };
      get_user_valid_id: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      get_user_with_signature: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      handle_formsly_payment: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      handle_missed_schedule: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      hr_response_analytics: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      insert_group_member: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      insert_project_member: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      inventory_request_page_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      leave_team: {
        Args: {
          team_id: string;
          team_member_id: string;
        };
        Returns: undefined;
      };
      modal_form_on_load: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      ped_part_check: {
        Args: {
          input_data: Json;
        };
        Returns: boolean;
      };
      phone_interview_validation: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      redirect_to_new_team: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      request_page_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      seed_request: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      send_notification_to_project_cost_engineer: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      team_invoice_on_load: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      transfer_ownership: {
        Args: {
          owner_id: string;
          member_id: string;
        };
        Returns: undefined;
      };
      update_asset: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_background_check_status: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_custom_field: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_drawer_data: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_form_group: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      update_form_signer: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_hr_phone_interview_status: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_item: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_item_category: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
      update_job_offer_status: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_multiple_admin: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_multiple_approver: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_questionnaire_position: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_schedule: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_security_group: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_technical_interview_schedule: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_technical_interview_status: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_technical_question_option: {
        Args: {
          input_data: Json
        }
        Returns: Json
      }
      update_ticket_status: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_trade_test_schedule: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_trade_test_status: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_questionnaire_position: {
        Args: {
          input_data: Json;
        };
        Returns: Json;
      };
      update_user: {
        Args: {
          input_data: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  request_schema: {
    Tables: {
      comment_table: {
        Row: {
          comment_content: string | null;
          comment_date_created: string;
          comment_id: string;
          comment_is_disabled: boolean;
          comment_is_edited: boolean | null;
          comment_last_updated: string | null;
          comment_request_id: string;
          comment_team_member_id: string;
          comment_type: string;
        };
        Insert: {
          comment_content?: string | null;
          comment_date_created?: string;
          comment_id?: string;
          comment_is_disabled?: boolean;
          comment_is_edited?: boolean | null;
          comment_last_updated?: string | null;
          comment_request_id: string;
          comment_team_member_id: string;
          comment_type: string;
        };
        Update: {
          comment_content?: string | null;
          comment_date_created?: string;
          comment_id?: string;
          comment_is_disabled?: boolean;
          comment_is_edited?: boolean | null;
          comment_last_updated?: string | null;
          comment_request_id?: string;
          comment_team_member_id?: string;
          comment_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_table_comment_request_id_fkey";
            columns: ["comment_request_id"];
            isOneToOne: false;
            referencedRelation: "request_table";
            referencedColumns: ["request_id"];
          },
        ];
      };
      request_response_table: {
        Row: {
          request_response: string;
          request_response_duplicatable_section_id: string | null;
          request_response_field_id: string;
          request_response_id: string;
          request_response_prefix: string | null;
          request_response_request_id: string;
        };
        Insert: {
          request_response: string;
          request_response_duplicatable_section_id?: string | null;
          request_response_field_id: string;
          request_response_id?: string;
          request_response_prefix?: string | null;
          request_response_request_id: string;
        };
        Update: {
          request_response?: string;
          request_response_duplicatable_section_id?: string | null;
          request_response_field_id?: string;
          request_response_id?: string;
          request_response_prefix?: string | null;
          request_response_request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "request_response_table_request_response_request_id_fkey";
            columns: ["request_response_request_id"];
            isOneToOne: false;
            referencedRelation: "request_table";
            referencedColumns: ["request_id"];
          },
        ];
      };
      request_score_table: {
        Row: {
          request_score_id: string;
          request_score_request_id: string;
          request_score_value: number;
        };
        Insert: {
          request_score_id?: string;
          request_score_request_id: string;
          request_score_value: number;
        };
        Update: {
          request_score_id?: string;
          request_score_request_id?: string;
          request_score_value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "request_score_table_request_score_request_id_fkey";
            columns: ["request_score_request_id"];
            isOneToOne: false;
            referencedRelation: "request_table";
            referencedColumns: ["request_id"];
          },
        ];
      };
      request_signer_table: {
        Row: {
          request_signer_id: string;
          request_signer_request_id: string;
          request_signer_signer_id: string;
          request_signer_status: string;
          request_signer_status_date_updated: string | null;
        };
        Insert: {
          request_signer_id?: string;
          request_signer_request_id: string;
          request_signer_signer_id: string;
          request_signer_status?: string;
          request_signer_status_date_updated?: string | null;
        };
        Update: {
          request_signer_id?: string;
          request_signer_request_id?: string;
          request_signer_signer_id?: string;
          request_signer_status?: string;
          request_signer_status_date_updated?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "request_signer_table_request_signer_request_id_fkey";
            columns: ["request_signer_request_id"];
            isOneToOne: false;
            referencedRelation: "request_table";
            referencedColumns: ["request_id"];
          },
        ];
      };
      request_table: {
        Row: {
          request_date_created: string;
          request_form_id: string;
          request_formsly_id_prefix: string | null;
          request_formsly_id_serial: string | null;
          request_id: string;
          request_is_disabled: boolean;
          request_jira_id: string | null;
          request_jira_link: string | null;
          request_otp_id: string | null;
          request_project_id: string | null;
          request_status: string;
          request_status_date_updated: string | null;
          request_team_member_id: string | null;
        };
        Insert: {
          request_date_created?: string;
          request_form_id: string;
          request_formsly_id_prefix?: string | null;
          request_formsly_id_serial?: string | null;
          request_id?: string;
          request_is_disabled?: boolean;
          request_jira_id?: string | null;
          request_jira_link?: string | null;
          request_otp_id?: string | null;
          request_project_id?: string | null;
          request_status?: string;
          request_status_date_updated?: string | null;
          request_team_member_id?: string | null;
        };
        Update: {
          request_date_created?: string;
          request_form_id?: string;
          request_formsly_id_prefix?: string | null;
          request_formsly_id_serial?: string | null;
          request_id?: string;
          request_is_disabled?: boolean;
          request_jira_id?: string | null;
          request_jira_link?: string | null;
          request_otp_id?: string | null;
          request_project_id?: string | null;
          request_status?: string;
          request_status_date_updated?: string | null;
          request_team_member_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  service_schema: {
    Tables: {
      service_category_table: {
        Row: {
          service_category: string;
          service_category_date_created: string;
          service_category_id: string;
          service_category_is_available: boolean;
          service_category_is_disabled: boolean;
          service_category_team_id: string;
        };
        Insert: {
          service_category: string;
          service_category_date_created?: string;
          service_category_id?: string;
          service_category_is_available?: boolean;
          service_category_is_disabled?: boolean;
          service_category_team_id: string;
        };
        Update: {
          service_category?: string;
          service_category_date_created?: string;
          service_category_id?: string;
          service_category_is_available?: boolean;
          service_category_is_disabled?: boolean;
          service_category_team_id?: string;
        };
        Relationships: [];
      };
      service_scope_choice_table: {
        Row: {
          service_scope_choice_date_created: string;
          service_scope_choice_id: string;
          service_scope_choice_is_available: boolean;
          service_scope_choice_is_disabled: boolean;
          service_scope_choice_name: string;
          service_scope_choice_service_scope_id: string;
        };
        Insert: {
          service_scope_choice_date_created?: string;
          service_scope_choice_id?: string;
          service_scope_choice_is_available?: boolean;
          service_scope_choice_is_disabled?: boolean;
          service_scope_choice_name: string;
          service_scope_choice_service_scope_id: string;
        };
        Update: {
          service_scope_choice_date_created?: string;
          service_scope_choice_id?: string;
          service_scope_choice_is_available?: boolean;
          service_scope_choice_is_disabled?: boolean;
          service_scope_choice_name?: string;
          service_scope_choice_service_scope_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_scope_choice_table_service_scope_choice_service_sc_fkey";
            columns: ["service_scope_choice_service_scope_id"];
            isOneToOne: false;
            referencedRelation: "service_scope_table";
            referencedColumns: ["service_scope_id"];
          },
        ];
      };
      service_scope_table: {
        Row: {
          service_scope_date_created: string;
          service_scope_field_id: string;
          service_scope_id: string;
          service_scope_is_available: boolean;
          service_scope_is_disabled: boolean;
          service_scope_is_with_other: boolean;
          service_scope_name: string;
          service_scope_service_id: string;
          service_scope_type: string;
        };
        Insert: {
          service_scope_date_created?: string;
          service_scope_field_id: string;
          service_scope_id?: string;
          service_scope_is_available?: boolean;
          service_scope_is_disabled?: boolean;
          service_scope_is_with_other: boolean;
          service_scope_name: string;
          service_scope_service_id: string;
          service_scope_type: string;
        };
        Update: {
          service_scope_date_created?: string;
          service_scope_field_id?: string;
          service_scope_id?: string;
          service_scope_is_available?: boolean;
          service_scope_is_disabled?: boolean;
          service_scope_is_with_other?: boolean;
          service_scope_name?: string;
          service_scope_service_id?: string;
          service_scope_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_scope_table_service_scope_service_id_fkey";
            columns: ["service_scope_service_id"];
            isOneToOne: false;
            referencedRelation: "service_table";
            referencedColumns: ["service_id"];
          },
        ];
      };
      service_table: {
        Row: {
          service_date_created: string;
          service_id: string;
          service_is_available: boolean;
          service_is_disabled: boolean;
          service_name: string;
          service_team_id: string;
        };
        Insert: {
          service_date_created?: string;
          service_id?: string;
          service_is_available?: boolean;
          service_is_disabled?: boolean;
          service_name: string;
          service_team_id: string;
        };
        Update: {
          service_date_created?: string;
          service_id?: string;
          service_is_available?: boolean;
          service_is_disabled?: boolean;
          service_name?: string;
          service_team_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  subcon_schema: {
    Tables: {
      subcon_description_field_table: {
        Row: {
          subcon_description_field_date_created: string;
          subcon_description_field_id: string;
          subcon_description_field_is_available: boolean;
          subcon_description_field_is_disabled: boolean;
          subcon_description_field_subcon_description_id: string;
          subcon_description_field_value: string;
        };
        Insert: {
          subcon_description_field_date_created?: string;
          subcon_description_field_id?: string;
          subcon_description_field_is_available?: boolean;
          subcon_description_field_is_disabled?: boolean;
          subcon_description_field_subcon_description_id: string;
          subcon_description_field_value: string;
        };
        Update: {
          subcon_description_field_date_created?: string;
          subcon_description_field_id?: string;
          subcon_description_field_is_available?: boolean;
          subcon_description_field_is_disabled?: boolean;
          subcon_description_field_subcon_description_id?: string;
          subcon_description_field_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subcon_description_field_tabl_subcon_description_field_sub_fkey";
            columns: ["subcon_description_field_subcon_description_id"];
            isOneToOne: false;
            referencedRelation: "subcon_description_table";
            referencedColumns: ["subcon_description_id"];
          },
        ];
      };
      subcon_description_table: {
        Row: {
          subcon_description_date_created: string;
          subcon_description_field_id: string;
          subcon_description_field_type: string;
          subcon_description_id: string;
          subcon_description_is_available: boolean;
          subcon_description_is_disabled: boolean;
          subcon_description_is_required: boolean;
          subcon_description_label: string;
          subcon_description_order: number;
          subcon_description_subcon_id: string;
        };
        Insert: {
          subcon_description_date_created?: string;
          subcon_description_field_id: string;
          subcon_description_field_type: string;
          subcon_description_id?: string;
          subcon_description_is_available?: boolean;
          subcon_description_is_disabled?: boolean;
          subcon_description_is_required?: boolean;
          subcon_description_label: string;
          subcon_description_order: number;
          subcon_description_subcon_id: string;
        };
        Update: {
          subcon_description_date_created?: string;
          subcon_description_field_id?: string;
          subcon_description_field_type?: string;
          subcon_description_id?: string;
          subcon_description_is_available?: boolean;
          subcon_description_is_disabled?: boolean;
          subcon_description_is_required?: boolean;
          subcon_description_label?: string;
          subcon_description_order?: number;
          subcon_description_subcon_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subcon_description_table_subcon_description_subcon_id_fkey";
            columns: ["subcon_description_subcon_id"];
            isOneToOne: false;
            referencedRelation: "subcon_table";
            referencedColumns: ["subcon_id"];
          },
        ];
      };
      subcon_table: {
        Row: {
          subcon_date_created: string;
          subcon_id: string;
          subcon_is_available: boolean;
          subcon_is_disabled: boolean;
          subcon_label: string;
          subcon_team_id: string;
        };
        Insert: {
          subcon_date_created?: string;
          subcon_id?: string;
          subcon_is_available?: boolean;
          subcon_is_disabled?: boolean;
          subcon_label: string;
          subcon_team_id: string;
        };
        Update: {
          subcon_date_created?: string;
          subcon_id?: string;
          subcon_is_available?: boolean;
          subcon_is_disabled?: boolean;
          subcon_label?: string;
          subcon_team_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  team_schema: {
    Tables: {
      supplier_table: {
        Row: {
          supplier: string;
          supplier_date_created: string;
          supplier_id: string;
          supplier_is_available: boolean;
          supplier_is_disabled: boolean;
          supplier_team_id: string;
        };
        Insert: {
          supplier: string;
          supplier_date_created?: string;
          supplier_id?: string;
          supplier_is_available?: boolean;
          supplier_is_disabled?: boolean;
          supplier_team_id: string;
        };
        Update: {
          supplier?: string;
          supplier_date_created?: string;
          supplier_id?: string;
          supplier_is_available?: boolean;
          supplier_is_disabled?: boolean;
          supplier_team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_table_supplier_team_id_fkey";
            columns: ["supplier_team_id"];
            isOneToOne: false;
            referencedRelation: "team_table";
            referencedColumns: ["team_id"];
          },
        ];
      };
      team_department_table: {
        Row: {
          team_department_date_created: string;
          team_department_id: string;
          team_department_is_disabled: boolean;
          team_department_name: string;
        };
        Insert: {
          team_department_date_created?: string;
          team_department_id?: string;
          team_department_is_disabled?: boolean;
          team_department_name: string;
        };
        Update: {
          team_department_date_created?: string;
          team_department_id?: string;
          team_department_is_disabled?: boolean;
          team_department_name?: string;
        };
        Relationships: [];
      };
      team_group_member_table: {
        Row: {
          team_group_id: string;
          team_group_member_id: string;
          team_member_id: string;
        };
        Insert: {
          team_group_id: string;
          team_group_member_id?: string;
          team_member_id: string;
        };
        Update: {
          team_group_id?: string;
          team_group_member_id?: string;
          team_member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_group_member_table_team_group_id_fkey";
            columns: ["team_group_id"];
            isOneToOne: false;
            referencedRelation: "team_group_table";
            referencedColumns: ["team_group_id"];
          },
          {
            foreignKeyName: "team_group_member_table_team_member_id_fkey";
            columns: ["team_member_id"];
            isOneToOne: false;
            referencedRelation: "team_member_table";
            referencedColumns: ["team_member_id"];
          },
        ];
      };
      team_group_table: {
        Row: {
          team_group_date_created: string;
          team_group_id: string;
          team_group_is_disabled: boolean;
          team_group_name: string;
          team_group_team_id: string;
        };
        Insert: {
          team_group_date_created?: string;
          team_group_id?: string;
          team_group_is_disabled?: boolean;
          team_group_name: string;
          team_group_team_id: string;
        };
        Update: {
          team_group_date_created?: string;
          team_group_id?: string;
          team_group_is_disabled?: boolean;
          team_group_name?: string;
          team_group_team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_group_table_team_group_team_id_fkey";
            columns: ["team_group_team_id"];
            isOneToOne: false;
            referencedRelation: "team_table";
            referencedColumns: ["team_id"];
          },
        ];
      };
      team_key_record_table: {
        Row: {
          team_key_record_access_api: string;
          team_key_record_date_created: string;
          team_key_record_key_id: string;
          team_key_record_team_key_id: string;
        };
        Insert: {
          team_key_record_access_api: string;
          team_key_record_date_created?: string;
          team_key_record_key_id?: string;
          team_key_record_team_key_id: string;
        };
        Update: {
          team_key_record_access_api?: string;
          team_key_record_date_created?: string;
          team_key_record_key_id?: string;
          team_key_record_team_key_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_key_record_table_team_key_record_team_key_id_fkey";
            columns: ["team_key_record_team_key_id"];
            isOneToOne: false;
            referencedRelation: "team_key_table";
            referencedColumns: ["team_key_id"];
          },
        ];
      };
      team_key_table: {
        Row: {
          team_key_api_key: string;
          team_key_date_created: string;
          team_key_id: string;
          team_key_is_disabled: boolean;
          team_key_label: string;
          team_key_team_id: string;
        };
        Insert: {
          team_key_api_key: string;
          team_key_date_created?: string;
          team_key_id?: string;
          team_key_is_disabled?: boolean;
          team_key_label: string;
          team_key_team_id: string;
        };
        Update: {
          team_key_api_key?: string;
          team_key_date_created?: string;
          team_key_id?: string;
          team_key_is_disabled?: boolean;
          team_key_label?: string;
          team_key_team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_key_table_team_key_team_id_fkey";
            columns: ["team_key_team_id"];
            isOneToOne: false;
            referencedRelation: "team_table";
            referencedColumns: ["team_id"];
          },
        ];
      };
      team_member_table: {
        Row: {
          team_member_date_created: string;
          team_member_id: string;
          team_member_is_disabled: boolean;
          team_member_role: string;
          team_member_team_id: string;
          team_member_user_id: string;
        };
        Insert: {
          team_member_date_created?: string;
          team_member_id?: string;
          team_member_is_disabled?: boolean;
          team_member_role?: string;
          team_member_team_id: string;
          team_member_user_id: string;
        };
        Update: {
          team_member_date_created?: string;
          team_member_id?: string;
          team_member_is_disabled?: boolean;
          team_member_role?: string;
          team_member_team_id?: string;
          team_member_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_member_table_team_member_team_id_fkey";
            columns: ["team_member_team_id"];
            isOneToOne: false;
            referencedRelation: "team_table";
            referencedColumns: ["team_id"];
          },
        ];
      };
      team_project_member_table: {
        Row: {
          team_member_id: string;
          team_project_id: string;
          team_project_member_id: string;
        };
        Insert: {
          team_member_id: string;
          team_project_id: string;
          team_project_member_id?: string;
        };
        Update: {
          team_member_id?: string;
          team_project_id?: string;
          team_project_member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_project_member_table_team_member_id_fkey";
            columns: ["team_member_id"];
            isOneToOne: false;
            referencedRelation: "team_member_table";
            referencedColumns: ["team_member_id"];
          },
          {
            foreignKeyName: "team_project_member_table_team_project_id_fkey";
            columns: ["team_project_id"];
            isOneToOne: false;
            referencedRelation: "team_project_table";
            referencedColumns: ["team_project_id"];
          },
        ];
      };
      team_project_table: {
        Row: {
          team_project_address_id: string | null;
          team_project_boq_attachment_id: string | null;
          team_project_code: string;
          team_project_date_created: string;
          team_project_id: string;
          team_project_is_disabled: boolean;
          team_project_name: string;
          team_project_site_map_attachment_id: string | null;
          team_project_team_id: string;
        };
        Insert: {
          team_project_address_id?: string | null;
          team_project_boq_attachment_id?: string | null;
          team_project_code: string;
          team_project_date_created?: string;
          team_project_id?: string;
          team_project_is_disabled?: boolean;
          team_project_name: string;
          team_project_site_map_attachment_id?: string | null;
          team_project_team_id: string;
        };
        Update: {
          team_project_address_id?: string | null;
          team_project_boq_attachment_id?: string | null;
          team_project_code?: string;
          team_project_date_created?: string;
          team_project_id?: string;
          team_project_is_disabled?: boolean;
          team_project_name?: string;
          team_project_site_map_attachment_id?: string | null;
          team_project_team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_project_table_team_project_team_id_fkey";
            columns: ["team_project_team_id"];
            isOneToOne: false;
            referencedRelation: "team_table";
            referencedColumns: ["team_id"];
          },
        ];
      };
      team_table: {
        Row: {
          team_date_created: string;
          team_expiration: string | null;
          team_id: string;
          team_is_disabled: boolean;
          team_is_request_signature_required: boolean;
          team_logo: string | null;
          team_name: string;
          team_user_id: string;
        };
        Insert: {
          team_date_created?: string;
          team_expiration?: string | null;
          team_id?: string;
          team_is_disabled?: boolean;
          team_is_request_signature_required?: boolean;
          team_logo?: string | null;
          team_name: string;
          team_user_id: string;
        };
        Update: {
          team_date_created?: string;
          team_expiration?: string | null;
          team_id?: string;
          team_is_disabled?: boolean;
          team_is_request_signature_required?: boolean;
          team_logo?: string | null;
          team_name?: string;
          team_user_id?: string;
        };
        Relationships: [];
      };
      team_transaction_table: {
        Row: {
          team_transaction_date_created: string;
          team_transaction_id: string;
          team_transaction_number_of_months: number;
          team_transaction_price: number;
          team_transaction_team_expiration_date: string;
          team_transaction_team_id: string;
        };
        Insert: {
          team_transaction_date_created?: string;
          team_transaction_id?: string;
          team_transaction_number_of_months: number;
          team_transaction_price: number;
          team_transaction_team_expiration_date: string;
          team_transaction_team_id: string;
        };
        Update: {
          team_transaction_date_created?: string;
          team_transaction_id?: string;
          team_transaction_number_of_months?: number;
          team_transaction_price?: number;
          team_transaction_team_expiration_date?: string;
          team_transaction_team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_transaction_table_team_transaction_team_id_fkey";
            columns: ["team_transaction_team_id"];
            isOneToOne: false;
            referencedRelation: "team_table";
            referencedColumns: ["team_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  ticket_schema: {
    Tables: {
      ticket_category_table: {
        Row: {
          ticket_category: string;
          ticket_category_id: string;
          ticket_category_is_active: boolean;
          ticket_category_is_disabled: boolean;
        };
        Insert: {
          ticket_category: string;
          ticket_category_id?: string;
          ticket_category_is_active?: boolean;
          ticket_category_is_disabled?: boolean;
        };
        Update: {
          ticket_category?: string;
          ticket_category_id?: string;
          ticket_category_is_active?: boolean;
          ticket_category_is_disabled?: boolean;
        };
        Relationships: [];
      };
      ticket_comment_table: {
        Row: {
          ticket_comment_content: string;
          ticket_comment_date_created: string;
          ticket_comment_id: string;
          ticket_comment_is_disabled: boolean;
          ticket_comment_is_edited: boolean;
          ticket_comment_last_updated: string | null;
          ticket_comment_team_member_id: string;
          ticket_comment_ticket_id: string;
          ticket_comment_type: string;
        };
        Insert: {
          ticket_comment_content: string;
          ticket_comment_date_created?: string;
          ticket_comment_id?: string;
          ticket_comment_is_disabled?: boolean;
          ticket_comment_is_edited?: boolean;
          ticket_comment_last_updated?: string | null;
          ticket_comment_team_member_id: string;
          ticket_comment_ticket_id: string;
          ticket_comment_type: string;
        };
        Update: {
          ticket_comment_content?: string;
          ticket_comment_date_created?: string;
          ticket_comment_id?: string;
          ticket_comment_is_disabled?: boolean;
          ticket_comment_is_edited?: boolean;
          ticket_comment_last_updated?: string | null;
          ticket_comment_team_member_id?: string;
          ticket_comment_ticket_id?: string;
          ticket_comment_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_comment_table_ticket_comment_ticket_id_fkey";
            columns: ["ticket_comment_ticket_id"];
            isOneToOne: false;
            referencedRelation: "ticket_table";
            referencedColumns: ["ticket_id"];
          },
        ];
      };
      ticket_field_table: {
        Row: {
          ticket_field_id: string;
          ticket_field_is_read_only: boolean;
          ticket_field_is_required: boolean;
          ticket_field_name: string;
          ticket_field_order: number;
          ticket_field_section_id: string;
          ticket_field_type: string;
        };
        Insert: {
          ticket_field_id?: string;
          ticket_field_is_read_only?: boolean;
          ticket_field_is_required?: boolean;
          ticket_field_name: string;
          ticket_field_order: number;
          ticket_field_section_id: string;
          ticket_field_type: string;
        };
        Update: {
          ticket_field_id?: string;
          ticket_field_is_read_only?: boolean;
          ticket_field_is_required?: boolean;
          ticket_field_name?: string;
          ticket_field_order?: number;
          ticket_field_section_id?: string;
          ticket_field_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_field_table_ticket_field_section_id_fkey";
            columns: ["ticket_field_section_id"];
            isOneToOne: false;
            referencedRelation: "ticket_section_table";
            referencedColumns: ["ticket_section_id"];
          },
        ];
      };
      ticket_option_table: {
        Row: {
          ticket_option_field_id: string;
          ticket_option_id: string;
          ticket_option_order: number;
          ticket_option_value: string;
        };
        Insert: {
          ticket_option_field_id: string;
          ticket_option_id?: string;
          ticket_option_order: number;
          ticket_option_value: string;
        };
        Update: {
          ticket_option_field_id?: string;
          ticket_option_id?: string;
          ticket_option_order?: number;
          ticket_option_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_option_table_ticket_option_field_id_fkey";
            columns: ["ticket_option_field_id"];
            isOneToOne: false;
            referencedRelation: "ticket_field_table";
            referencedColumns: ["ticket_field_id"];
          },
        ];
      };
      ticket_response_table: {
        Row: {
          ticket_response_duplicatable_section_id: string | null;
          ticket_response_field_id: string;
          ticket_response_id: string;
          ticket_response_ticket_id: string;
          ticket_response_value: string;
        };
        Insert: {
          ticket_response_duplicatable_section_id?: string | null;
          ticket_response_field_id: string;
          ticket_response_id?: string;
          ticket_response_ticket_id: string;
          ticket_response_value: string;
        };
        Update: {
          ticket_response_duplicatable_section_id?: string | null;
          ticket_response_field_id?: string;
          ticket_response_id?: string;
          ticket_response_ticket_id?: string;
          ticket_response_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_response_table_ticket_response_field_id_fkey";
            columns: ["ticket_response_field_id"];
            isOneToOne: false;
            referencedRelation: "ticket_field_table";
            referencedColumns: ["ticket_field_id"];
          },
          {
            foreignKeyName: "ticket_response_table_ticket_response_ticket_id_fkey";
            columns: ["ticket_response_ticket_id"];
            isOneToOne: false;
            referencedRelation: "ticket_table";
            referencedColumns: ["ticket_id"];
          },
        ];
      };
      ticket_section_table: {
        Row: {
          ticket_section_category_id: string;
          ticket_section_id: string;
          ticket_section_is_duplicatable: boolean;
          ticket_section_name: string;
        };
        Insert: {
          ticket_section_category_id: string;
          ticket_section_id?: string;
          ticket_section_is_duplicatable?: boolean;
          ticket_section_name: string;
        };
        Update: {
          ticket_section_category_id?: string;
          ticket_section_id?: string;
          ticket_section_is_duplicatable?: boolean;
          ticket_section_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_section_table_ticket_section_category_id_fkey";
            columns: ["ticket_section_category_id"];
            isOneToOne: false;
            referencedRelation: "ticket_category_table";
            referencedColumns: ["ticket_category_id"];
          },
        ];
      };
      ticket_table: {
        Row: {
          ticket_approver_team_member_id: string | null;
          ticket_category_id: string;
          ticket_date_created: string;
          ticket_id: string;
          ticket_is_disabled: boolean;
          ticket_requester_team_member_id: string;
          ticket_status: string;
          ticket_status_date_updated: string | null;
        };
        Insert: {
          ticket_approver_team_member_id?: string | null;
          ticket_category_id: string;
          ticket_date_created?: string;
          ticket_id?: string;
          ticket_is_disabled?: boolean;
          ticket_requester_team_member_id: string;
          ticket_status?: string;
          ticket_status_date_updated?: string | null;
        };
        Update: {
          ticket_approver_team_member_id?: string | null;
          ticket_category_id?: string;
          ticket_date_created?: string;
          ticket_id?: string;
          ticket_is_disabled?: boolean;
          ticket_requester_team_member_id?: string;
          ticket_status?: string;
          ticket_status_date_updated?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_table_ticket_category_id_fkey";
            columns: ["ticket_category_id"];
            isOneToOne: false;
            referencedRelation: "ticket_category_table";
            referencedColumns: ["ticket_category_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  unit_of_measurement_schema: {
    Tables: {
      capacity_unit_of_measurement_table: {
        Row: {
          capacity_unit_of_measurement: string;
          capacity_unit_of_measurement_date_created: string;
          capacity_unit_of_measurement_id: string;
          capacity_unit_of_measurement_is_available: boolean;
          capacity_unit_of_measurement_is_disabled: boolean;
          capacity_unit_of_measurement_team_id: string;
        };
        Insert: {
          capacity_unit_of_measurement: string;
          capacity_unit_of_measurement_date_created?: string;
          capacity_unit_of_measurement_id?: string;
          capacity_unit_of_measurement_is_available?: boolean;
          capacity_unit_of_measurement_is_disabled?: boolean;
          capacity_unit_of_measurement_team_id: string;
        };
        Update: {
          capacity_unit_of_measurement?: string;
          capacity_unit_of_measurement_date_created?: string;
          capacity_unit_of_measurement_id?: string;
          capacity_unit_of_measurement_is_available?: boolean;
          capacity_unit_of_measurement_is_disabled?: boolean;
          capacity_unit_of_measurement_team_id?: string;
        };
        Relationships: [];
      };
      equipment_unit_of_measurement_table: {
        Row: {
          equipment_unit_of_measurement: string;
          equipment_unit_of_measurement_date_created: string;
          equipment_unit_of_measurement_id: string;
          equipment_unit_of_measurement_is_available: boolean;
          equipment_unit_of_measurement_is_disabled: boolean;
          equipment_unit_of_measurement_team_id: string;
        };
        Insert: {
          equipment_unit_of_measurement: string;
          equipment_unit_of_measurement_date_created?: string;
          equipment_unit_of_measurement_id?: string;
          equipment_unit_of_measurement_is_available?: boolean;
          equipment_unit_of_measurement_is_disabled?: boolean;
          equipment_unit_of_measurement_team_id: string;
        };
        Update: {
          equipment_unit_of_measurement?: string;
          equipment_unit_of_measurement_date_created?: string;
          equipment_unit_of_measurement_id?: string;
          equipment_unit_of_measurement_is_available?: boolean;
          equipment_unit_of_measurement_is_disabled?: boolean;
          equipment_unit_of_measurement_team_id?: string;
        };
        Relationships: [];
      };
      general_unit_of_measurement_table: {
        Row: {
          general_unit_of_measurement: string;
          general_unit_of_measurement_date_created: string;
          general_unit_of_measurement_id: string;
          general_unit_of_measurement_is_available: boolean;
          general_unit_of_measurement_is_disabled: boolean;
          general_unit_of_measurement_team_id: string;
        };
        Insert: {
          general_unit_of_measurement: string;
          general_unit_of_measurement_date_created?: string;
          general_unit_of_measurement_id?: string;
          general_unit_of_measurement_is_available?: boolean;
          general_unit_of_measurement_is_disabled?: boolean;
          general_unit_of_measurement_team_id: string;
        };
        Update: {
          general_unit_of_measurement?: string;
          general_unit_of_measurement_date_created?: string;
          general_unit_of_measurement_id?: string;
          general_unit_of_measurement_is_available?: boolean;
          general_unit_of_measurement_is_disabled?: boolean;
          general_unit_of_measurement_team_id?: string;
        };
        Relationships: [];
      };
      item_unit_of_measurement_table: {
        Row: {
          item_unit_of_measurement: string;
          item_unit_of_measurement_date_created: string;
          item_unit_of_measurement_id: string;
          item_unit_of_measurement_is_available: boolean;
          item_unit_of_measurement_is_disabled: boolean;
          item_unit_of_measurement_team_id: string;
        };
        Insert: {
          item_unit_of_measurement: string;
          item_unit_of_measurement_date_created?: string;
          item_unit_of_measurement_id?: string;
          item_unit_of_measurement_is_available?: boolean;
          item_unit_of_measurement_is_disabled?: boolean;
          item_unit_of_measurement_team_id: string;
        };
        Update: {
          item_unit_of_measurement?: string;
          item_unit_of_measurement_date_created?: string;
          item_unit_of_measurement_id?: string;
          item_unit_of_measurement_is_available?: boolean;
          item_unit_of_measurement_is_disabled?: boolean;
          item_unit_of_measurement_team_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  user_schema: {
    Tables: {
      email_resend_table: {
        Row: {
          email_resend_date_created: string;
          email_resend_email: string;
          email_resend_id: string;
        };
        Insert: {
          email_resend_date_created?: string;
          email_resend_email: string;
          email_resend_id?: string;
        };
        Update: {
          email_resend_date_created?: string;
          email_resend_email?: string;
          email_resend_id?: string;
        };
        Relationships: [];
      };
      invitation_table: {
        Row: {
          invitation_date_created: string;
          invitation_from_team_member_id: string;
          invitation_id: string;
          invitation_is_disabled: boolean;
          invitation_status: string;
          invitation_to_email: string;
        };
        Insert: {
          invitation_date_created?: string;
          invitation_from_team_member_id: string;
          invitation_id?: string;
          invitation_is_disabled?: boolean;
          invitation_status?: string;
          invitation_to_email: string;
        };
        Update: {
          invitation_date_created?: string;
          invitation_from_team_member_id?: string;
          invitation_id?: string;
          invitation_is_disabled?: boolean;
          invitation_status?: string;
          invitation_to_email?: string;
        };
        Relationships: [];
      };
      user_employee_number_table: {
        Row: {
          user_employee_number: string;
          user_employee_number_date_created: string;
          user_employee_number_id: string;
          user_employee_number_is_disabled: boolean;
          user_employee_number_user_id: string | null;
        };
        Insert: {
          user_employee_number: string;
          user_employee_number_date_created?: string;
          user_employee_number_id?: string;
          user_employee_number_is_disabled?: boolean;
          user_employee_number_user_id?: string | null;
        };
        Update: {
          user_employee_number?: string;
          user_employee_number_date_created?: string;
          user_employee_number_id?: string;
          user_employee_number_is_disabled?: boolean;
          user_employee_number_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_employee_number_table_user_employee_number_user_id_fkey";
            columns: ["user_employee_number_user_id"];
            isOneToOne: false;
            referencedRelation: "user_table";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_sss_table: {
        Row: {
          user_sss_back_image_url: string;
          user_sss_date_created: string;
          user_sss_front_image_url: string;
          user_sss_id: string;
          user_sss_number: string;
          user_sss_user_id: string;
        };
        Insert: {
          user_sss_back_image_url: string;
          user_sss_date_created?: string;
          user_sss_front_image_url: string;
          user_sss_id?: string;
          user_sss_number: string;
          user_sss_user_id: string;
        };
        Update: {
          user_sss_back_image_url?: string;
          user_sss_date_created?: string;
          user_sss_front_image_url?: string;
          user_sss_id?: string;
          user_sss_number?: string;
          user_sss_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_sss_table_user_sss_user_id_fkey";
            columns: ["user_sss_user_id"];
            isOneToOne: false;
            referencedRelation: "user_table";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_table: {
        Row: {
          user_active_app: string;
          user_active_team_id: string | null;
          user_avatar: string | null;
          user_date_created: string;
          user_email: string;
          user_first_name: string;
          user_id: string;
          user_is_disabled: boolean;
          user_job_title: string | null;
          user_last_name: string;
          user_phone_number: string | null;
          user_signature_attachment_id: string | null;
          user_username: string;
        };
        Insert: {
          user_active_app?: string;
          user_active_team_id?: string | null;
          user_avatar?: string | null;
          user_date_created?: string;
          user_email: string;
          user_first_name: string;
          user_id?: string;
          user_is_disabled?: boolean;
          user_job_title?: string | null;
          user_last_name: string;
          user_phone_number?: string | null;
          user_signature_attachment_id?: string | null;
          user_username: string;
        };
        Update: {
          user_active_app?: string;
          user_active_team_id?: string | null;
          user_avatar?: string | null;
          user_date_created?: string;
          user_email?: string;
          user_first_name?: string;
          user_id?: string;
          user_is_disabled?: boolean;
          user_job_title?: string | null;
          user_last_name?: string;
          user_phone_number?: string | null;
          user_signature_attachment_id?: string | null;
          user_username?: string;
        };
        Relationships: [];
      };
      user_valid_id_table: {
        Row: {
          user_valid_id_address_id: string;
          user_valid_id_approver_user_id: string | null;
          user_valid_id_back_image_url: string | null;
          user_valid_id_date_created: string;
          user_valid_id_date_updated: string | null;
          user_valid_id_first_name: string;
          user_valid_id_front_image_url: string;
          user_valid_id_gender: string;
          user_valid_id_id: string;
          user_valid_id_last_name: string;
          user_valid_id_middle_name: string;
          user_valid_id_nationality: string;
          user_valid_id_number: string;
          user_valid_id_status: string;
          user_valid_id_type: string;
          user_valid_id_user_id: string;
        };
        Insert: {
          user_valid_id_address_id: string;
          user_valid_id_approver_user_id?: string | null;
          user_valid_id_back_image_url?: string | null;
          user_valid_id_date_created?: string;
          user_valid_id_date_updated?: string | null;
          user_valid_id_first_name: string;
          user_valid_id_front_image_url: string;
          user_valid_id_gender: string;
          user_valid_id_id?: string;
          user_valid_id_last_name: string;
          user_valid_id_middle_name: string;
          user_valid_id_nationality: string;
          user_valid_id_number: string;
          user_valid_id_status: string;
          user_valid_id_type: string;
          user_valid_id_user_id: string;
        };
        Update: {
          user_valid_id_address_id?: string;
          user_valid_id_approver_user_id?: string | null;
          user_valid_id_back_image_url?: string | null;
          user_valid_id_date_created?: string;
          user_valid_id_date_updated?: string | null;
          user_valid_id_first_name?: string;
          user_valid_id_front_image_url?: string;
          user_valid_id_gender?: string;
          user_valid_id_id?: string;
          user_valid_id_last_name?: string;
          user_valid_id_middle_name?: string;
          user_valid_id_nationality?: string;
          user_valid_id_number?: string;
          user_valid_id_status?: string;
          user_valid_id_type?: string;
          user_valid_id_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_valid_id_table_user_valid_id_approver_user_id_fkey";
            columns: ["user_valid_id_approver_user_id"];
            isOneToOne: false;
            referencedRelation: "user_table";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "user_valid_id_table_user_valid_id_user_id_fkey";
            columns: ["user_valid_id_user_id"];
            isOneToOne: false;
            referencedRelation: "user_table";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  workflow_schema: {
    Tables: {
      edge_table: {
        Row: {
          edge_id: string;
          edge_is_start_edge: boolean;
          edge_label: string;
          edge_marker_end_type: string;
          edge_source_handle: string;
          edge_source_node_id: string;
          edge_target_handle: string;
          edge_target_node_id: string;
          edge_workflow_version_id: string;
        };
        Insert: {
          edge_id?: string;
          edge_is_start_edge: boolean;
          edge_label: string;
          edge_marker_end_type: string;
          edge_source_handle: string;
          edge_source_node_id: string;
          edge_target_handle: string;
          edge_target_node_id: string;
          edge_workflow_version_id: string;
        };
        Update: {
          edge_id?: string;
          edge_is_start_edge?: boolean;
          edge_label?: string;
          edge_marker_end_type?: string;
          edge_source_handle?: string;
          edge_source_node_id?: string;
          edge_target_handle?: string;
          edge_target_node_id?: string;
          edge_workflow_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "edge_table_edge_source_node_id_fkey";
            columns: ["edge_source_node_id"];
            isOneToOne: false;
            referencedRelation: "node_table";
            referencedColumns: ["node_id"];
          },
          {
            foreignKeyName: "edge_table_edge_target_node_id_fkey";
            columns: ["edge_target_node_id"];
            isOneToOne: false;
            referencedRelation: "node_table";
            referencedColumns: ["node_id"];
          },
          {
            foreignKeyName: "edge_table_edge_workflow_version_id_fkey";
            columns: ["edge_workflow_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_version_table";
            referencedColumns: ["workflow_version_id"];
          },
        ];
      };
      module_form_table: {
        Row: {
          modulde_form_form_id: string;
          module_form_date_created: string;
          module_form_id: string;
          module_form_is_disabled: boolean;
          module_form_module_version_id: string;
          module_form_order: number;
        };
        Insert: {
          modulde_form_form_id: string;
          module_form_date_created?: string;
          module_form_id?: string;
          module_form_is_disabled?: boolean;
          module_form_module_version_id: string;
          module_form_order: number;
        };
        Update: {
          modulde_form_form_id?: string;
          module_form_date_created?: string;
          module_form_id?: string;
          module_form_is_disabled?: boolean;
          module_form_module_version_id?: string;
          module_form_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "module_form_table_module_form_module_version_id_fkey";
            columns: ["module_form_module_version_id"];
            isOneToOne: false;
            referencedRelation: "module_version_table";
            referencedColumns: ["module_version_id"];
          },
        ];
      };
      module_table: {
        Row: {
          module_date_created: string;
          module_id: string;
          module_is_disabled: boolean;
          module_name: string;
          module_team_id: string;
        };
        Insert: {
          module_date_created?: string;
          module_id?: string;
          module_is_disabled?: boolean;
          module_name: string;
          module_team_id: string;
        };
        Update: {
          module_date_created?: string;
          module_id?: string;
          module_is_disabled?: boolean;
          module_name?: string;
          module_team_id?: string;
        };
        Relationships: [];
      };
      module_version_table: {
        Row: {
          module_version_created_by_team_member_id: string;
          module_version_date_created: string;
          module_version_date_updated: string | null;
          module_version_id: string;
          module_version_label: number;
          module_version_module_id: string;
          module_version_updated_by_team_member_id: string | null;
        };
        Insert: {
          module_version_created_by_team_member_id: string;
          module_version_date_created?: string;
          module_version_date_updated?: string | null;
          module_version_id?: string;
          module_version_label: number;
          module_version_module_id: string;
          module_version_updated_by_team_member_id?: string | null;
        };
        Update: {
          module_version_created_by_team_member_id?: string;
          module_version_date_created?: string;
          module_version_date_updated?: string | null;
          module_version_id?: string;
          module_version_label?: number;
          module_version_module_id?: string;
          module_version_updated_by_team_member_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_version_table_module_version_module_id_fkey";
            columns: ["module_version_module_id"];
            isOneToOne: false;
            referencedRelation: "module_table";
            referencedColumns: ["module_id"];
          },
        ];
      };
      node_project_signer_table: {
        Row: {
          node_project_signer_id: string;
          node_project_signer_node_project_id: string;
          node_project_signer_team_member_id: string;
        };
        Insert: {
          node_project_signer_id?: string;
          node_project_signer_node_project_id: string;
          node_project_signer_team_member_id: string;
        };
        Update: {
          node_project_signer_id?: string;
          node_project_signer_node_project_id?: string;
          node_project_signer_team_member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "node_project_signer_table_node_project_signer_node_project_fkey";
            columns: ["node_project_signer_node_project_id"];
            isOneToOne: false;
            referencedRelation: "node_project_table";
            referencedColumns: ["node_project_id"];
          },
        ];
      };
      node_project_table: {
        Row: {
          node_project_id: string;
          node_project_node_id: string;
          node_project_signer_count_to_proceed: number;
          node_project_team_project_id: string;
        };
        Insert: {
          node_project_id?: string;
          node_project_node_id: string;
          node_project_signer_count_to_proceed: number;
          node_project_team_project_id: string;
        };
        Update: {
          node_project_id?: string;
          node_project_node_id?: string;
          node_project_signer_count_to_proceed?: number;
          node_project_team_project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "node_project_table_node_project_node_id_fkey";
            columns: ["node_project_node_id"];
            isOneToOne: false;
            referencedRelation: "node_table";
            referencedColumns: ["node_id"];
          },
        ];
      };
      node_table: {
        Row: {
          node_background_color: string;
          node_font_color: string;
          node_height: number;
          node_id: string;
          node_is_deletable: boolean;
          node_label: string;
          node_type: string;
          node_width: number;
          node_workflow_version_id: string;
          node_x_position: number;
          node_y_position: number;
        };
        Insert: {
          node_background_color: string;
          node_font_color: string;
          node_height: number;
          node_id?: string;
          node_is_deletable: boolean;
          node_label: string;
          node_type: string;
          node_width: number;
          node_workflow_version_id: string;
          node_x_position: number;
          node_y_position: number;
        };
        Update: {
          node_background_color?: string;
          node_font_color?: string;
          node_height?: number;
          node_id?: string;
          node_is_deletable?: boolean;
          node_label?: string;
          node_type?: string;
          node_width?: number;
          node_workflow_version_id?: string;
          node_x_position?: number;
          node_y_position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "node_table_node_workflow_version_id_fkey";
            columns: ["node_workflow_version_id"];
            isOneToOne: false;
            referencedRelation: "workflow_version_table";
            referencedColumns: ["workflow_version_id"];
          },
        ];
      };
      workflow_table: {
        Row: {
          workflow_date_created: string;
          workflow_id: string;
          workflow_is_disabled: boolean;
          workflow_label: string;
          workflow_team_id: string;
        };
        Insert: {
          workflow_date_created?: string;
          workflow_id?: string;
          workflow_is_disabled?: boolean;
          workflow_label: string;
          workflow_team_id: string;
        };
        Update: {
          workflow_date_created?: string;
          workflow_id?: string;
          workflow_is_disabled?: boolean;
          workflow_label?: string;
          workflow_team_id?: string;
        };
        Relationships: [];
      };
      workflow_version_table: {
        Row: {
          workflow_version_created_by_team_member_id: string;
          workflow_version_date_created: string;
          workflow_version_date_updated: string | null;
          workflow_version_id: string;
          workflow_version_label: number;
          workflow_version_updated_by_team_member_id: string | null;
          workflow_version_workflow_id: string;
        };
        Insert: {
          workflow_version_created_by_team_member_id: string;
          workflow_version_date_created?: string;
          workflow_version_date_updated?: string | null;
          workflow_version_id?: string;
          workflow_version_label: number;
          workflow_version_updated_by_team_member_id?: string | null;
          workflow_version_workflow_id: string;
        };
        Update: {
          workflow_version_created_by_team_member_id?: string;
          workflow_version_date_created?: string;
          workflow_version_date_updated?: string | null;
          workflow_version_id?: string;
          workflow_version_label?: number;
          workflow_version_updated_by_team_member_id?: string | null;
          workflow_version_workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_version_table_workflow_version_workflow_id_fkey";
            columns: ["workflow_version_workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflow_table";
            referencedColumns: ["workflow_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
