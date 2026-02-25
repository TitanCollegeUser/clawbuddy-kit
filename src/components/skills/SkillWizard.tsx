import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillBasicInfoStep } from './SkillBasicInfoStep';
import { SkillApiConfigStep } from './SkillApiConfigStep';
import { SkillOperationsStep } from './SkillOperationsStep';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCreateSkill,
  useUpdateSkill,
  useSubmitSkillForReview,
  type Skill,
  type AuthType,
  type SkillStatus,
  type ProtocolType,
  type AgentReviewStatus,
} from '@/hooks/useSkills';
import { useCreateOperation, useUpdateOperation, useDeleteOperation, type SkillOperation, type HttpMethod } from '@/hooks/useSkillOperations';
import type { Json } from '@/integrations/supabase/types';
import { 
  getDefaultConfig, 
  type RestConnectionConfig,
  type SmtpConnectionConfig,
  type GraphqlConnectionConfig,
  type WebhookConnectionConfig,
  type CustomConnectionConfig,
} from './protocols';

interface SkillWizardProps {
  existingSkill?: Skill;
  existingOperations?: SkillOperation[];
  onComplete: () => void;
  onCancel: () => void;
}

export interface SkillFormData {
  name: string;
  title: string;
  description: string;
  useCases: string[];
  // Legacy REST fields (kept for backward compatibility)
  apiBaseUrl: string;
  authType: AuthType;
  authHeader: string;
  authFormat: string;
  apiKey: string;
  status: SkillStatus;
  // New flexible config fields
  protocolType: ProtocolType;
  connectionConfig: RestConnectionConfig | SmtpConnectionConfig | GraphqlConnectionConfig | WebhookConnectionConfig | CustomConnectionConfig;
  additionalNotes: string;
  bujjiStatus: AgentReviewStatus;
  bujjiFeedback: string | null;
}

export interface OperationFormData {
  id?: string;
  name: string;
  title: string;
  description: string;
  httpMethod: HttpMethod;
  endpointPath: string;
  requestBodySchema: string;
  responseSchema: string;
  exampleRequest: string;
  exampleResponse: string;
}

const steps = [
  { id: 1, title: 'Basic Info', description: 'Name and description' },
  { id: 2, title: 'API Config', description: 'Authentication setup' },
  { id: 3, title: 'Operations', description: 'Define endpoints' },
];

export const SkillWizard = ({
  existingSkill,
  existingOperations = [],
  onComplete,
  onCancel,
}: SkillWizardProps) => {
  const { user } = useAuth();
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const createOperation = useCreateOperation();
  const updateOperation = useUpdateOperation();
  const deleteOperation = useDeleteOperation();
  const submitForReview = useSubmitSkillForReview();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize connection config based on existing skill or default
  const getInitialConnectionConfig = () => {
    if (existingSkill?.connection_config && typeof existingSkill.connection_config === 'object' && !Array.isArray(existingSkill.connection_config)) {
      const config = existingSkill.connection_config as Record<string, unknown>;
      // Check if it has the expected REST config structure
      if ('base_url' in config && 'auth' in config) {
        return config as unknown as RestConnectionConfig;
      }
    }
    // For legacy skills without connection_config, build from individual fields
    return {
      base_url: existingSkill?.api_base_url || '',
      auth: {
        type: existingSkill?.auth_type || 'bearer',
        header: existingSkill?.auth_header || 'Authorization',
        format: existingSkill?.auth_format || 'Bearer {KEY}',
      },
    } as RestConnectionConfig;
  };

  const [skillData, setSkillData] = useState<SkillFormData>({
    name: existingSkill?.name || '',
    title: existingSkill?.title || '',
    description: existingSkill?.description || '',
    useCases: existingSkill?.use_cases || [],
    apiBaseUrl: existingSkill?.api_base_url || '',
    authType: existingSkill?.auth_type || 'bearer',
    authHeader: existingSkill?.auth_header || 'Authorization',
    authFormat: existingSkill?.auth_format || 'Bearer {KEY}',
    apiKey: '', // Never pre-fill for security
    status: existingSkill?.status || 'draft',
    // New flexible config fields
    protocolType: (existingSkill?.protocol_type as ProtocolType) || 'rest',
    connectionConfig: getInitialConnectionConfig(),
    additionalNotes: existingSkill?.additional_notes || '',
    bujjiStatus: (existingSkill?.bujji_status as AgentReviewStatus) || 'pending',
    bujjiFeedback: existingSkill?.bujji_feedback || null,
  });

  const [operations, setOperations] = useState<OperationFormData[]>(
    existingOperations.map((op) => ({
      id: op.id,
      name: op.name,
      title: op.title,
      description: op.description || '',
      httpMethod: op.http_method as HttpMethod,
      endpointPath: op.endpoint_path,
      requestBodySchema: JSON.stringify(op.request_body_schema, null, 2),
      responseSchema: JSON.stringify(op.response_schema, null, 2),
      exampleRequest: JSON.stringify(op.example_request, null, 2),
      exampleResponse: JSON.stringify(op.example_response, null, 2),
    }))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [createdSkillId, setCreatedSkillId] = useState<string | undefined>(existingSkill?.id);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const parseJsonSafe = (str: string): Json => {
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  };

  const handleSave = async (asDraft: boolean = true) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const status: SkillStatus = asDraft ? 'draft' : 'ready';
      
      let skillId = createdSkillId;

      if (existingSkill) {
        // Update existing skill
        await updateSkill.mutateAsync({
          id: existingSkill.id,
          name: skillData.name,
          title: skillData.title,
          description: skillData.description || null,
          use_cases: skillData.useCases,
          api_base_url: skillData.apiBaseUrl,
          auth_type: skillData.authType,
          auth_header: skillData.authHeader,
          auth_format: skillData.authFormat,
          api_key_encrypted: skillData.apiKey || existingSkill.api_key_encrypted,
          status,
          // New flexible config fields
          protocol_type: skillData.protocolType,
          connection_config: skillData.connectionConfig as unknown as Json,
          additional_notes: skillData.additionalNotes || null,
        });
        skillId = existingSkill.id;
      } else {
        // Create new skill
        const newSkill = await createSkill.mutateAsync({
          name: skillData.name,
          title: skillData.title,
          description: skillData.description || undefined,
          use_cases: skillData.useCases,
          api_base_url: skillData.apiBaseUrl,
          auth_type: skillData.authType,
          auth_header: skillData.authHeader,
          auth_format: skillData.authFormat,
          api_key_encrypted: skillData.apiKey || undefined,
          status,
          created_by: user.id,
          // New flexible config fields
          protocol_type: skillData.protocolType,
          connection_config: skillData.connectionConfig as unknown as Json,
          additional_notes: skillData.additionalNotes || undefined,
        });
        skillId = newSkill.id;
        setCreatedSkillId(skillId);
      }

      // Handle operations
      const existingOpIds = new Set(existingOperations.map((op) => op.id));
      const currentOpIds = new Set(operations.filter((op) => op.id).map((op) => op.id!));

      // Delete removed operations
      for (const existingOp of existingOperations) {
        if (!currentOpIds.has(existingOp.id)) {
          await deleteOperation.mutateAsync({ id: existingOp.id, skillId: skillId! });
        }
      }

      // Create or update operations
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const operationData = {
          name: op.name,
          title: op.title,
          description: op.description || undefined,
          http_method: op.httpMethod,
          endpoint_path: op.endpointPath,
          request_body_schema: parseJsonSafe(op.requestBodySchema),
          response_schema: parseJsonSafe(op.responseSchema),
          example_request: parseJsonSafe(op.exampleRequest),
          example_response: parseJsonSafe(op.exampleResponse),
          position: i,
        };

        if (op.id && existingOpIds.has(op.id)) {
          await updateOperation.mutateAsync({
            id: op.id,
            ...operationData,
          });
        } else {
          await createOperation.mutateAsync({
            skill_id: skillId!,
            ...operationData,
          });
        }
      }

      return createdSkillId || skillId;
    } catch (error) {
      console.error('Error saving skill:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      const skillId = await handleSave(false);
      if (skillId) {
        await submitForReview.mutateAsync(skillId);
      }
      onComplete();
    } catch (error) {
      console.error('Error submitting for review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                    currentStep > step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep === step.id
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    'text-sm font-medium',
                    currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-16 sm:w-24 h-0.5 mx-4 transition-colors duration-300',
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <SkillBasicInfoStep
              data={skillData}
              onChange={setSkillData}
              onNext={handleNext}
              onCancel={onCancel}
              isEditing={!!existingSkill}
            />
          )}
          
          {currentStep === 2 && (
            <SkillApiConfigStep
              data={skillData}
              onChange={setSkillData}
              onNext={handleNext}
              onBack={handleBack}
              onCancel={onCancel}
            />
          )}
          
          {currentStep === 3 && (
            <SkillOperationsStep
              operations={operations}
              onChange={setOperations}
              onBack={handleBack}
              onCancel={onCancel}
              onSaveAsDraft={() => { handleSave(true); onComplete(); }}
              onCreateSkill={() => { handleSave(false); onComplete(); }}
              onSubmitToAi={handleSubmitForReview}
              isSaving={isSaving}
              isSubmitting={isSubmitting}
              aiName="AI"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
