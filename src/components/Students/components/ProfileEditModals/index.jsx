// Unified Profile Edit Modal System
// This provides both the new unified modal and backward-compatible named exports

import UnifiedProfileEditModal from './UnifiedProfileEditModal';
import PersonalInfoEditModalComponent from './PersonalInfoEditModal';
export { FIELD_CONFIGS } from './fieldConfigs';
export * from './utils';

// Export the unified modal
export { default as UnifiedProfileEditModal } from './UnifiedProfileEditModal';

// Backward-compatible wrapper components
// These allow existing code to continue working without changes

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

export const PersonalInfoEditModal = ({ isOpen, onClose, data, onSave }) => (
  <PersonalInfoEditModalComponent isOpen={isOpen} onClose={onClose} data={data} onSave={onSave} />
);

// Default export for convenience
export default UnifiedProfileEditModal;
