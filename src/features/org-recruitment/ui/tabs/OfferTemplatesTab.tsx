/**
 * Offer Templates Tab
 * CRUD for offer letter templates
 */

import { useState, useEffect } from 'react';
import {
    DocumentTextIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import {
    useOfferTemplates,
    useCreateOfferTemplate,
    useUpdateOfferTemplate,
    useDeleteOfferTemplate,
    type OfferLetterTemplate,
} from '@/entities/recruitment';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('OfferTemplatesTab');

type ModalMode = 'create' | 'edit' | null;

export const OfferTemplatesTab = () => {
    const { data: templatesData, isLoading } = useOfferTemplates();
    const createTemplate = useCreateOfferTemplate();
    const updateTemplate = useUpdateOfferTemplate();
    const deleteTemplate = useDeleteOfferTemplate();

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<OfferLetterTemplate | null>(null);
    const [formData, setFormData] = useState({
        template_name: '',
        template_content: '',
        is_default: false,
    });
    const [showSuccess, setShowSuccess] = useState(false);

    const templates = templatesData?.templates || [];

    const handleCreate = () => {
        setModalMode('create');
        setFormData({
            template_name: '',
            template_content: '',
            is_default: false,
        });
    };

    const handleEdit = (template: OfferLetterTemplate) => {
        setModalMode('edit');
        setSelectedTemplate(template);
        setFormData({
            template_name: template.template_name,
            template_content: template.template_content,
            is_default: template.is_default,
        });
    };

    const handleDelete = async (template: OfferLetterTemplate) => {
        if (!confirm(`Are you sure you want to delete "${template.template_name}"?`)) {
            return;
        }

        try {
            await deleteTemplate.mutateAsync(template.id);
            logger.info('Template deleted', { templateId: template.id });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error: any) {
            logger.error('Template delete failed', { error: error.message });
            alert('Failed to delete template: ' + error.message);
        }
    };

    const handleSubmit = async () => {
        if (!formData.template_name.trim()) {
            alert('Please enter a template name');
            return;
        }

        if (!formData.template_content.trim()) {
            alert('Please enter template content');
            return;
        }

        try {
            if (modalMode === 'create') {
                await createTemplate.mutateAsync(formData);
                logger.info('Template created');
            } else if (modalMode === 'edit' && selectedTemplate) {
                await updateTemplate.mutateAsync({
                    templateId: selectedTemplate.id,
                    data: formData,
                });
                logger.info('Template updated');
            }

            setModalMode(null);
            setSelectedTemplate(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error: any) {
            logger.error('Template save failed', { error: error.message });
            alert('Failed to save template: ' + error.message);
        }
    };

    const handleCancel = () => {
        setModalMode(null);
        setSelectedTemplate(null);
        setFormData({
            template_name: '',
            template_content: '',
            is_default: false,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {showSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-800">
                            Template saved successfully!
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Your offer letter template has been updated.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Offer Letter Templates</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Create and manage customizable offer letter templates
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Template
                </button>
            </div>

            {/* Variables Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Available Variables
                </h4>
                <div className="text-xs text-blue-800 space-y-1">
                    <p>
                        Use these variables in your template (they will be replaced with actual
                        values):
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 font-mono">
                        <span>{'{{candidate_name}}'}</span>
                        <span>{'{{position_title}}'}</span>
                        <span>{'{{company_name}}'}</span>
                        <span>{'{{salary}}'}</span>
                        <span>{'{{start_date}}'}</span>
                        <span>{'{{department}}'}</span>
                        <span>{'{{manager_name}}'}</span>
                        <span>{'{{location}}'}</span>
                    </div>
                </div>
            </div>

            {/* Templates List */}
            {templates.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Templates Yet
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Create your first offer letter template to get started
                    </p>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create Template
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            {template.template_name}
                                        </h4>
                                        {template.is_default && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-800">
                                                <StarIconSolid className="w-3 h-3" />
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Created on{' '}
                                        {new Date(template.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 max-h-32 overflow-y-auto">
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                            {template.template_content.substring(0, 200)}
                                            {template.template_content.length > 200 && '...'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit template"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template)}
                                        disabled={template.is_default}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={
                                            template.is_default
                                                ? 'Cannot delete default template'
                                                : 'Delete template'
                                        }
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {modalMode === 'create' ? 'Create New Template' : 'Edit Template'}
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Template Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.template_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, template_name: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Standard Offer Letter"
                                />
                            </div>

                            {/* Template Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template Content <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.template_content}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            template_content: e.target.value,
                                        })
                                    }
                                    rows={16}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    placeholder={`Dear {{candidate_name}},

We are pleased to offer you the position of {{position_title}} at {{company_name}}.

Your proposed start date is {{start_date}}, and your annual salary will be {{salary}}.

Best regards,
{{company_name}} Team`}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Use variables like {'{{candidate_name}}'} that will be replaced
                                    with actual values
                                </p>
                            </div>

                            {/* Set as Default */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Set as Default Template
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This template will be used by default for new offers
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            is_default: !formData.is_default,
                                        })
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_default ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_default ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={createTemplate.isPending || updateTemplate.isPending}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={createTemplate.isPending || updateTemplate.isPending}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {createTemplate.isPending || updateTemplate.isPending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        {modalMode === 'create' ? 'Create Template' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
