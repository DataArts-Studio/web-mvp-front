import {
  CreateProjectDTO,
  CreateProjectDomain,
  ProjectDTO,
  ProjectDomain,
  ProjectForm,
} from './types';

export const toProjectDomain = (dto: ProjectDTO): ProjectDomain => {
  return {
    id: dto.id,
    projectName: dto.name,
    identifier: dto.identifier,
    description: dto.description ? dto.description : undefined,
    ownerName: dto.owner_name ? dto.owner_name : undefined,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
    archivedAt: dto.archived_at ? new Date(dto.archived_at) : null,
    lifecycleStatus: dto.lifecycle_status,
  };
};

export const toProjectList = (dtos: ProjectDTO[]): ProjectDomain[] => {
  return dtos.map(toProjectDomain);
};

export const toProjectDto = (domain: CreateProjectDomain): CreateProjectDTO => {
  return {
    name: domain.projectName,
    identifier: domain.identifier,
    description: domain.description ? domain.description : null,
    owner_name: domain.ownerName ? domain.ownerName : null,
  };
};

export const formToDomain = (formData: ProjectForm): CreateProjectDomain => {
  const { identifierConfirm, ageConfirmed, termsAgreed, ...rest } = formData;
  return rest;
};
