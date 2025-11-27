import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Upload, CheckCircle, XCircle, DollarSign, 
  FileText, Search, Filter, Download 
} from 'lucide-react';
import { admissionService } from '@/services/studentManagementService';
import type { AdmissionApplication } from '@/types/StudentManagement';

const AdmissionsWorkflow: React.FC = () => {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  cons