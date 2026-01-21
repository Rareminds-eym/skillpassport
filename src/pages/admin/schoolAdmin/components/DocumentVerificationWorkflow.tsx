import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  AlertCircle,
  Clock,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { getTeachers, updateTeacherStatus } from '../../../../services/teacherService';
import { useUserRole } from '../../../../hooks/useUserRole';

interface PendingTeacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: string;
  qualification?: string;
  experience_years?: number;
  degree_certificate_url?: string;
  id_proof_url?: string;
  experience_letters_url?: string[];
  resume_url?: string;
}
