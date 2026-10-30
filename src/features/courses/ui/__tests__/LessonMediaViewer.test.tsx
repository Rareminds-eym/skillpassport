import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LessonMediaViewer } from '../LessonMediaViewer';

vi.mock('../PptxContentViewer', () => ({ PptxContentViewer: ({ title }: { title: string }) => <div>Preview: {title}</div> }));

const resources = [{ title: 'Registration.pptx', url: '/demo-course/registration.pptx', type: 'document' }];

describe('LessonMediaViewer', () => {
  it('shows video first and switches to an inline presentation without following a download link', async () => {
    const pause = vi.fn();
    render(<LessonMediaViewer videoUrl="/video.mp4" videoLoading={false} resources={resources} onLeaveVideo={pause}><video data-testid="video" /></LessonMediaViewer>);
    expect(screen.getByRole('button', { name: /1\. Lesson video/ })).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: /2\. Registration/ }));
    expect(await screen.findByText('Preview: Registration.pptx')).toBeInTheDocument();
    expect(pause).toHaveBeenCalledOnce();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByTestId('video')).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /1\. Lesson video/ }));
    expect(screen.getByTestId('video')).toBeVisible();
  });

  it('previews a presentation when a lesson has no video', async () => {
    render(<LessonMediaViewer videoLoading={false} resources={resources} onLeaveVideo={vi.fn()}>{null}</LessonMediaViewer>);
    expect(await screen.findByText('Preview: Registration.pptx')).toBeInTheDocument();
    expect(screen.queryByText('Lesson video')).not.toBeInTheDocument();
  });

  it('recognizes dashboard PPTX uploads by the original asset key even with a custom name', async () => {
    const resource = { title: 'Training slides', url: '/api/storage/media-proxy?token=opaque', originalUrl: '/api/courses/assets?key=courses%2Fresources%2F2026%2F10%2Fslides.pptx', type: 'document' };
    render(<LessonMediaViewer videoLoading={false} resources={[resource]} onLeaveVideo={vi.fn()}>{null}</LessonMediaViewer>);
    expect(await screen.findByText('Preview: Training slides')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Training slides/ })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Course resources' })).not.toBeInTheDocument();
  });

  it('offers old PPT uploads as downloads', async () => {
    const resource = { title: 'Old slides', url: '/api/courses/assets?key=courses%2Fresources%2F2026%2F10%2Fslides.ppt', type: 'document' };
    render(<LessonMediaViewer videoLoading={false} resources={[resource]} onLeaveVideo={vi.fn()}>{null}</LessonMediaViewer>);
    expect(screen.getByRole('button', { name: 'Download Old slides' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('shows the saved presentation-first order and lets the learner switch to video', async () => {
    render(<LessonMediaViewer videoUrl="/video.mp4" videoLoading={false} videoOrder={2} resources={[{ ...resources[0], order: 0 }]} onLeaveVideo={vi.fn()}><video data-testid="video" /></LessonMediaViewer>);
    expect(await screen.findByText('Preview: Registration.pptx')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\. Registration/ })).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: /2\. Lesson video/ }));
    expect(screen.getByTestId('video')).toBeVisible();
  });

  it('keeps Word and PDF files below the viewer as downloads', async () => {
    const files = [...resources, { title: 'Guide.docx', url: '/guide.docx', type: 'document', size: '2 MB' }, { title: 'Notes.pdf', url: '/notes.pdf', type: 'pdf' }, { title: 'Reference', url: 'https://example.com', type: 'link' }];
    render(<LessonMediaViewer videoUrl="/video.mp4" videoLoading={false} resources={files} onLeaveVideo={vi.fn()}>{null}</LessonMediaViewer>);
    const nav = screen.getByRole('navigation');
    expect(within(nav).getAllByRole('button')).toHaveLength(2);
    expect(within(nav).queryByText('Guide.docx')).not.toBeInTheDocument();
    const downloads = screen.getByRole('region', { name: 'Course resources' });
    expect(within(downloads).getByRole('button', { name: 'Download Guide.docx' })).toBeInTheDocument();
    expect(within(downloads).getByRole('button', { name: 'Download Notes.pdf' })).toBeInTheDocument();
    expect(within(downloads).getByText('document • 2 MB')).toBeInTheDocument();
    expect(within(downloads).getByRole('link', { name: /Reference/ })).toHaveAttribute('href', 'https://example.com');
  });

  it('downloads a Word attachment in a lesson without preview content', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, blob: async () => new Blob(['document']) } as Response);
    const createUrl = vi.fn(() => 'blob:document');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<LessonMediaViewer videoLoading={false} resources={[{ title: 'Guide.docx', url: '/guide.docx' }]} onLeaveVideo={vi.fn()}>{null}</LessonMediaViewer>);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download Guide.docx' }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith('/guide.docx');
    expect(createUrl).toHaveBeenCalledOnce();
    fetchMock.mockRestore();
    click.mockRestore();
  });

  it('handles empty lessons and offers older PowerPoint files for download', async () => {
    const { rerender } = render(<LessonMediaViewer videoLoading={false} resources={[]} onLeaveVideo={vi.fn()}>{null}</LessonMediaViewer>);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    rerender(<LessonMediaViewer videoLoading={false} resources={[{ title: 'Old.ppt', url: '/old.ppt' }]} onLeaveVideo={vi.fn()}>{null}</LessonMediaViewer>);
    expect(screen.getByRole('button', { name: 'Download Old.ppt' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
