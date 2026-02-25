-- Create skills table for API integration definitions
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  use_cases TEXT[] DEFAULT '{}',
  api_base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'bearer',
  auth_header TEXT NOT NULL DEFAULT 'Authorization',
  auth_format TEXT NOT NULL DEFAULT 'Bearer {KEY}',
  api_key_encrypted TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT skills_name_format CHECK (name ~ '^[a-z][a-z0-9-]{2,49}$'),
  CONSTRAINT skills_status_check CHECK (status IN ('draft', 'ready', 'archived')),
  CONSTRAINT skills_auth_type_check CHECK (auth_type IN ('bearer', 'api_key', 'basic'))
);

-- Create skill_operations table for API endpoints
CREATE TABLE public.skill_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  http_method TEXT NOT NULL DEFAULT 'GET',
  endpoint_path TEXT NOT NULL,
  request_body_schema JSONB DEFAULT '{}',
  response_schema JSONB DEFAULT '{}',
  example_request JSONB DEFAULT '{}',
  example_response JSONB DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT skill_operations_method_check CHECK (http_method IN ('GET', 'POST', 'PATCH', 'PUT', 'DELETE')),
  CONSTRAINT skill_operations_name_format CHECK (name ~ '^[a-z][a-z0-9_]{1,49}$'),
  UNIQUE(skill_id, name)
);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills
CREATE POLICY "Authenticated users can view all skills"
  ON public.skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own skills"
  ON public.skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own skills"
  ON public.skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own skills"
  ON public.skills FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for skill_operations (follow parent skill ownership)
CREATE POLICY "Authenticated users can view all skill operations"
  ON public.skill_operations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create operations for their skills"
  ON public.skill_operations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.skills WHERE id = skill_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can update operations for their skills"
  ON public.skill_operations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.skills WHERE id = skill_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can delete operations for their skills"
  ON public.skill_operations FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.skills WHERE id = skill_id AND created_by = auth.uid()
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skill_operations_updated_at
  BEFORE UPDATE ON public.skill_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_skills_status ON public.skills(status);
CREATE INDEX idx_skills_created_by ON public.skills(created_by);
CREATE INDEX idx_skill_operations_skill_id ON public.skill_operations(skill_id);
CREATE INDEX idx_skill_operations_position ON public.skill_operations(skill_id, position);