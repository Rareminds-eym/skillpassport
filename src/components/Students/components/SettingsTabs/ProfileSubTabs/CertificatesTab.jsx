import React from "react";
import { Award, Plus, Edit, Calendar, ExternalLink, Shield, Clock, CheckCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const CertificatesTab = ({ 
  certificatesData, 
  setShowCertificatesModal 
}) => {

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    
    return expiry > now && expiry <= threeMonthsFromNow;
  };

  const getCertificateStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'valid', color: 'bg-green-100 text-green-700 border-green-200' };
    
    if (isExpired(expiryDate)) {
      return { status: 'expired', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (isExpiringSoon(expiryDate)) {
      return { status: 'expiring', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    } else {
      return { status: 'valid', color: 'bg-green-100 text-green-700 border-green-200' };
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          Certificates
        </h3>
        <Button
          onClick={() => setShowCertificatesModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Certificate
        </Button>
      </div>

      {certificatesData?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">
            No certificates added yet
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Add your professional certifications, licenses, and achievements
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {(certificatesData || [])
            .sort((a, b) => {
              // Sort by issue date, most recent first
              const dateA = new Date(a.issueDate || 0);
              const dateB = new Date(b.issueDate || 0);
              return dateB - dateA;
            })
            .map((certificate, idx) => {
              const status = getCertificateStatus(certificate.expiryDate);
              
              return (
                <div
                  key={certificate.id || `cert-${idx}`}
                  className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-base font-bold text-gray-900">
                          {certificate.name || certificate.title || certificate.certificateName || certificate.certificate_name || "Certificate"}
                        </h4>
                        <div className="flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCertificatesModal(true)}
                          className="p-1 h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-600 font-medium">
                          {certificate.issuer || certificate.organization || certificate.institution || certificate.issuedBy || "Organization"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {certificate.issueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Issued: {formatDate(certificate.issueDate)}</span>
                          </div>
                        )}
                        
                        {certificate.expiryDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Expires: {formatDate(certificate.expiryDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`px-3 py-1 text-xs font-medium border ${status.color}`}>
                          {status.status === 'expired' ? 'Expired' : 
                           status.status === 'expiring' ? 'Expiring Soon' : 'Valid'}
                        </Badge>
                        
                        {certificate.category && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {certificate.category}
                          </Badge>
                        )}
                        
                        {certificate.level && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {certificate.level}
                          </Badge>
                        )}
                      </div>

                      {certificate.credentialId && (
                        <p className="text-xs text-gray-500 mb-2">
                          <span className="font-medium">Credential ID:</span> {certificate.credentialId}
                        </p>
                      )}

                      {certificate.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          {certificate.description}
                        </p>
                      )}

                      {certificate.credentialUrl && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(certificate.credentialUrl, '_blank')}
                            className="text-xs px-3 py-1 h-7 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Credential
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default CertificatesTab;