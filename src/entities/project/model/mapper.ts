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
    description: dto.description,
    ownerName: dto.owner_name,
    createAt: new Date(dto.create_at),
    updateAt: new Date(dto.update_at),
    deleteAt: dto.delete_at ? new Date(dto.delete_at) : null,
  };
};

export const toProjectList = (dtos: ProjectDTO[]): ProjectDomain[] => {
  return dtos.map(toProjectDomain);
};

export const toProjectDto = (domain: CreateProjectDomain): CreateProjectDTO => {
  return {
    name: domain.projectName,
    identifier: domain.identifier,
    description: domain.description,
    owner_name: domain.ownerName,
  };
};

export const formToDomain = (formData: ProjectForm): CreateProjectDomain => {
  const { identifierConfirm, ...rest } = formData;
  return rest;
};
