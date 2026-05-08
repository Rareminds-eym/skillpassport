import React from 'react';

export { default as AdmissionNoteModal } from '../LearnerProfileDrawer/modals/AdmissionNoteModal';
export { default as SchoolAdmissionNoteModal } from '../LearnerProfileDrawer/modals/SchoolAdmissionNoteModal';
export { default as MessageModal } from '../LearnerProfileDrawer/modals/MessageModal';
export { default as ExportModal } from '@/entities/learner/ui/modals/ExportModal';
export { default as ApprovalModal } from '../LearnerProfileDrawer/modals/ApprovalModal';
export { default as PromotionModal } from '../LearnerProfileDrawer/modals/PromotionModal';
export { default as GraduationModal } from '../LearnerProfileDrawer/modals/GraduationModal';
export { default as DocumentsModal } from '../LearnerProfileDrawer/modals/DocumentsModal';

// Profile edit modals - moved from widgets to features
import UnifiedProfileEditModal from './UnifiedProfileEditModal';
import PersonalInfoEditModalComponent from './PersonalInfoEditModal';

export { default as UnifiedProfileEditModal } from './UnifiedProfileEditModal';
export { default as ProfileItemModal } from './ProfileItemModal';
export { FIELD_CONFIGS } from './fieldConfigs';
export * from './utils';

// Backward-compatible wrapper components for profile editing
export const EducationEditModal = ({ isOpen, onClose, data, onSave }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="education"
    data={data}
    onSave={onSave}
  />
);

export const TrainingEditModal = ({ isOpen, onClose, data, onSave, singleEditMode = false }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="training"
    data={data}
    onSave={onSave}
    singleEditMode={singleEditMode}
  />
);

export const ExperienceEditModal = ({ isOpen, onClose, data, onSave }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="experience"
    data={data}
    onSave={onSave}
  />
);

export const ProjectsEditModal = ({ isOpen, onClose, data, onSave }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="projects"
    data={data}
    onSave={onSave}
  />
);

export const CertificatesEditModal = ({ isOpen, onClose, data, onSave }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="certificates"
    data={data}
    onSave={onSave}
  />
);

export const SkillsEditModal = ({ isOpen, onClose, data, onSave }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="skills"
    data={data}
    onSave={onSave}
  />
);

export const SoftSkillsEditModal = ({ isOpen, onClose, data, onSave }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="softSkills"
    data={data}
    onSave={onSave}
  />
);

export const TechnicalSkillsEditModal = ({ isOpen, onClose, data, onSave }) => (
  <UnifiedProfileEditModal
    isOpen={isOpen}
    onClose={onClose}
    type="technicalSkills"
    data={data}
    onSave={onSave}
  />
);

export const PersonalInfoEditModal = ({ isOpen, onClose, data, onSave }) => (
  <PersonalInfoEditModalComponent
    isOpen={isOpen}
    onClose={onClose}
    data={data}
    onSave={onSave}
  />
);