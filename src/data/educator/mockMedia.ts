export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  size: number; // in bytes
  uploadedBy: string;
  uploadedDate: string;
  category: string;
  tags: string[];
  usedIn: string[]; // activity IDs
}

export const mockMediaAssets: MediaAsset[] = [
  {
    id: 'med-001',
    name: 'solar-project.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200',
    size: 2048576,
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2025-01-15T10:30:00Z',
    category: 'Projects',
    tags: ['science', 'renewable-energy', 'innovation'],
    usedIn: ['act-001'],
  },
  {
    id: 'med-002',
    name: 'freecodecamp-cert.pdf',
    type: 'document',
    url: 'https://via.placeholder.com/800x600/10b981/ffffff?text=Certificate',
    thumbnail: 'https://via.placeholder.com/200x150/10b981/ffffff?text=Cert',
    size: 512000,
    uploadedBy: 'Michael Chen',
    uploadedDate: '2025-01-10T14:20:00Z',
    category: 'Certificates',
    tags: ['programming', 'javascript', 'certification'],
    usedIn: ['act-002'],
  },
  {
    id: 'med-003',
    name: 'mural-final.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200',
    size: 3145728,
    uploadedBy: 'Emma Rodriguez',
    uploadedDate: '2025-01-08T11:45:00Z',
    category: 'Art',
    tags: ['art', 'community-service', 'teamwork'],
    usedIn: ['act-003'],
  },
  {
    id: 'med-004',
    name: 'team-photo.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200',
    size: 1835008,
    uploadedBy: 'Emma Rodriguez',
    uploadedDate: '2025-01-08T11:50:00Z',
    category: 'Art',
    tags: ['teamwork', 'community-service'],
    usedIn: ['act-003'],
  },
  {
    id: 'med-005',
    name: 'tournament-trophy.jpg',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200',
    size: 2621440,
    uploadedBy: 'James Wilson',
    uploadedDate: '2025-01-14T09:00:00Z',
    category: 'Sports',
    tags: ['basketball', 'achievement', 'sports'],
    usedIn: ['act-004'],
  },
  {
    id: 'med-006',
    name: 'climate-research.pdf',
    type: 'document',
    url: 'https://via.placeholder.com/800x600/6366f1/ffffff?text=Research+Paper',
    thumbnail: 'https://via.placeholder.com/200x150/6366f1/ffffff?text=Paper',
    size: 1048576,
    uploadedBy: 'Olivia Martinez',
    uploadedDate: '2025-01-05T13:30:00Z',
    category: 'Research',
    tags: ['research', 'climate-change', 'science'],
    usedIn: ['act-005'],
  },
];
