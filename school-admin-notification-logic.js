/**
 * School Admin Notification & Discovery Logic
 * How School Admins know when students add Rareminds trainings
 */

// ==========================================
// 1. AUTOMATIC NOTIFICATION SYSTEM
// ==========================================

/**
 * When student adds Rareminds training:
 * 1. Training inserted with approval_status = 'pending'
 * 2. Trigger automatically fires: trigger_notify_training_submission
 * 3. Notification created in training_notifications table
 * 4. School Admin gets real-time notification
 */

// Example: Student adds training
const addTraining = async (studentData, trainingData) => {
  // When this INSERT happens...
  const { data, error } = await supabase
    .from('trainings')
    .insert({
      student_id: studentData.id,
      title: trainingData.title,
      organization: 'Rareminds', // This triggers school_admin routing
      approval_status: 'pending',
      approval_authority: 'school_admin', // Auto-set based on organization
      // ... other fields
    });

  // Trigger automatically creates notification:
  // INSERT INTO training_notifications (
  //   training_id: new_training.id,
  //   recipient_type: 'school_admin',
  //   school_id: student.school_id,
  //   message: 'New Rareminds training submitted by John Doe: "React Course" from Rareminds'
  // )
};

// ==========================================
// 2. SCHOOL ADMIN DASHBOARD DISCOVERY
// ==========================================

/**
 * School Admin Dashboard - Real-time Notifications
 */
const SchoolAdminDashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const schoolId = useSchoolId(); // Get current school admin's school

  // Get unread notification count (for badge)
  const getUnreadCount = async () => {
    const { data } = await supabase.rpc('get_unread_notification_count', {
      admin_school_id: schoolId,
      admin_type: 'school_admin'
    });
    setUnreadCount(data || 0);
  };

  // Get all notifications for this school
  const getNotifications = async (unreadOnly = false) => {
    const { data } = await supabase.rpc('get_school_admin_notifications', {
      admin_school_id: schoolId,
      unread_only: unreadOnly
    });
    setNotifications(data || []);
  };

  // Real-time subscription for new notifications
  useEffect(() => {
    const subscription = supabase
      .channel('training_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'training_notifications',
        filter: `school_id=eq.${schoolId}`
      }, (payload) => {
        // New notification received!
        console.log('🔔 New training notification:', payload.new);
        getNotifications(); // Refresh notifications
        getUnreadCount(); // Update badge count
        
        // Show toast notification
        toast.success(`New Rareminds training submitted for approval!`);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [schoolId]);

  return (
    <div className="school-admin-dashboard">
      {/* Notification Bell with Badge */}
      <div className="notification-bell">
        🔔 Notifications
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-panel">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${!notification.is_read ? 'unread' : ''}`}>
            <div className="message">{notification.message}</div>
            <div className="meta">
              Student: {notification.student_name} | 
              {notification.days_pending} days ago
            </div>
            <button onClick={() => reviewTraining(notification.training_id)}>
              Review Training
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. PENDING TRAININGS DISCOVERY
// ==========================================

/**
 * School Admin - Pending Trainings View
 */
const PendingTrainingsView = () => {
  const [pendingTrainings, setPendingTrainings] = useState([]);
  const schoolId = useSchoolId();

  // Get all pending Rareminds trainings for this school
  const getPendingTrainings = async () => {
    const { data } = await supabase.rpc('get_pending_school_trainings', {
      school_id: schoolId
    });
    setPendingTrainings(data || []);
  };

  useEffect(() => {
    getPendingTrainings();
    
    // Refresh every 30 seconds
    const interval = setInterval(getPendingTrainings, 30000);
    return () => clearInterval(interval);
  }, [schoolId]);

  return (
    <div className="pending-trainings">
      <h2>Pending Rareminds Trainings ({pendingTrainings.length})</h2>
      
      {pendingTrainings.map(training => (
        <div key={training.id} className="training-card">
          <div className="student-info">
            <strong>{training.student_name}</strong>
            <span>{training.student_email}</span>
          </div>
          
          <div className="training-info">
            <h3>{training.title}</h3>
            <p>Organization: {training.organization}</p>
            <p>Duration: {training.start_date} to {training.end_date}</p>
            <p>Submitted: {new Date(training.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="actions">
            <button onClick={() => approveTraining(training.id)}>
              ✅ Approve
            </button>
            <button onClick={() => rejectTraining(training.id)}>
              ❌ Reject
            </button>
            <button onClick={() => viewDetails(training.id)}>
              👁️ View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 4. EMAIL NOTIFICATION SYSTEM (Optional)
// ==========================================

/**
 * Email notifications for School Admins
 * Can be triggered via Edge Functions or external service
 */
const sendEmailNotification = async (schoolAdminEmail, trainingDetails) => {
  // This would be implemented as a Supabase Edge Function
  const emailContent = `
    New Rareminds Training Pending Approval
    
    Student: ${trainingDetails.student_name}
    Training: ${trainingDetails.title}
    Organization: ${trainingDetails.organization}
    Submitted: ${new Date().toLocaleDateString()}
    
    Please log in to your School Admin dashboard to review and approve this training.
    
    Dashboard Link: https://yourapp.com/school-admin/pending-trainings
  `;
  
  // Send email via your preferred service (SendGrid, etc.)
  await sendEmail({
    to: schoolAdminEmail,
    subject: 'New Training Pending Approval',
    body: emailContent
  });
};

// ==========================================
// 5. COMPLETE WORKFLOW EXAMPLE
// ==========================================

/**
 * Complete flow from student submission to school admin notification
 */
const completeWorkflow = async () => {
  // Step 1: Student submits Rareminds training
  console.log('📝 Student submits training...');
  
  // Step 2: System auto-routes to school_admin
  console.log('🔄 System routes to school_admin based on organization=Rareminds');
  
  // Step 3: Database trigger creates notification
  console.log('🔔 Notification created automatically');
  
  // Step 4: School Admin gets real-time notification
  console.log('📱 School Admin dashboard shows notification badge');
  
  // Step 5: School Admin reviews and approves
  console.log('👨‍💼 School Admin reviews training details');
  
  // Step 6: Training becomes visible in student profile
  console.log('✅ Training approved and visible to student');
};

export {
  SchoolAdminDashboard,
  PendingTrainingsView,
  sendEmailNotification,
  completeWorkflow
};