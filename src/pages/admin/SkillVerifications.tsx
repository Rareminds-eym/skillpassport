import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    getInstitutionPendingRequests,
    approveByInstitutionAdmin,
    rejectVerificationRequest
} from '../../services/skillVerificationService';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
    Code,
    MessageCircle,
    Loader2,
    Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SkillVerifications = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [filter, setFilter] = useState('all'); // all, technical, soft

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Only fetch for Institution Admin
            const result = await getInstitutionPendingRequests();

            if (result.success) {
                setRequests(result.data);
            } else {
                toast.error(result.error || 'Failed to load verification requests');
                console.error('Fetch error:', result.error);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request) => {
        setProcessingId(request.id);
        try {
            // Only Institution Admin approval
            const result = await approveByInstitutionAdmin(request.id, user?.id || 'admin-id', 'Approved by Institution');

            if (result.success) {
                toast.success('Approved and sent to Rareminds!');
                // Remove from list
                setRequests(prev => prev.filter(r => r.id !== request.id));
            } else {
                toast.error('Failed to approve request');
            }
        } catch (error) {
            console.error('Error approving:', error);
            toast.error('An error occurred');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request) => {
        const reason = prompt('Please enter a reason for rejection:');
        if (reason === null) return; // Cancelled

        setProcessingId(request.id);
        try {
            const result = await rejectVerificationRequest(request.id, user?.id || 'admin-id', reason, 'institution');

            if (result.success) {
                toast.success('Request rejected');
                setRequests(prev => prev.filter(r => r.id !== request.id));
            } else {
                toast.error('Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            toast.error('An error occurred');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.skill_type === filter;
    });

    const getSkillIcon = (type) => {
        return type === 'technical' ? <Code className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Skill Verifications</h1>
                    <p className="text-gray-600 mt-1">
                        Review skills submitted by students
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <Button
                        variant={filter === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="text-xs"
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'technical' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('technical')}
                        className="text-xs"
                    >
                        Technical
                    </Button>
                    <Button
                        variant={filter === 'soft' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('soft')}
                        className="text-xs"
                    >
                        Soft Skills
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p className="text-gray-500">No pending verification requests found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map((request) => (
                        <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    {/* Student Info Section */}
                                    <div className="p-6 bg-gray-50 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {request.students?.name?.charAt(0) || <User className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{request.students?.name || 'Unknown Student'}</h3>
                                                <p className="text-xs text-gray-500">{request.students?.department || 'Department N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">University:</span> {request.students?.university || 'N/A'}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">Submitted:</span>
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Skill Info Section */}
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                                        {getSkillIcon(request.skill_type)}
                                                        {request.skill_type === 'technical' ? 'Technical' : 'Soft Skill'}
                                                    </Badge>
                                                    {request.skill_category && (
                                                        <Badge variant="outline" className="text-gray-600">
                                                            {request.skill_category}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-2 h-2 rounded-full ${i < request.skill_level ? 'bg-yellow-400' : 'bg-gray-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <h2 className="text-xl font-bold text-gray-900 mb-2">{request.skill_name}</h2>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <Button
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleReject(request)}
                                                disabled={processingId === request.id}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleApprove(request)}
                                                disabled={processingId === request.id}
                                            >
                                                {processingId === request.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                )}
                                                Approve & Forward
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SkillVerifications;
