// src/components/editor/ExportButton.tsx
'use client'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { LoaderCircle, Download, AlertCircle, Upload } from 'lucide-react';
import { useIsExporting, useExportProgress, useExportVideo, useCurrentProject } from '@/store/editorStore';

export default function ExportButton() {
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const isExporting = useIsExporting();
    const progress = useExportProgress();
    const exportVideo = useExportVideo();
    const currentProject = useCurrentProject();

    const handleExport = async () => {
        try {
            setError(null);
            setVideoUrl(null);
            
            if (!currentProject?.metadata) {
                setError('No project data available. Please upload a video first.');
                return;
            }

            if (!currentProject?.originalFile) {
                setError('Original video file is missing. Please re-upload your video to enable export.');
                return;
            }

            // Debug logging
            console.log('=== FILE STORAGE DEBUG ===');
            console.log('File name:', currentProject.originalFile?.name || 'null');
            console.log('File type:', currentProject.originalFile?.type || 'null');
            console.log('File size:', currentProject.originalFile?.size || 'null');
            console.log('Has file data:', !!currentProject.originalFile);
            console.log('File data length:', currentProject.originalFile?.size || 0);
            console.log('File data preview:', currentProject.originalFile?.name?.substring(0, 50) + '...');
            console.log('========================');

            const resultUrl = await exportVideo();
            
            if (resultUrl) {
                setVideoUrl(resultUrl);
                // Automatically download the video
                const link = document.createElement('a');
                link.href = resultUrl;
                link.download = `${currentProject.name}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                setError('Export failed. Please try again.');
            }
        } catch (err: any) {
            console.error('Export error:', err);
            
            // Better error messaging
            let errorMessage = 'Export failed. Please try again.';
            
            if (err.message?.includes('Missing required data')) {
                errorMessage = 'Missing required data for export. Please re-upload your video.';
            } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (err.message?.includes('timeout')) {
                errorMessage = 'Export timed out. Please try again with a shorter video.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        }
    };

    const canExport = currentProject?.metadata && currentProject?.originalFile && !isExporting;
    const hasProject = !!currentProject?.metadata;
    const hasOriginalFile = !!currentProject?.originalFile;

    return (
        <div className='p-3 rounded-2xl flex flex-col gap-2 bg-neutral-800'>
            {/* Export Button */}
            <div className="flex flex-row items-center justify-between">
                <span className='text-sm text-neutral-400'>Export the video</span>
                <Button 
                    disabled={!canExport} 
                    onClick={handleExport} 
                    size={'lg'} 
                    className="bg-white/90 hover:bg-white/80 text-neutral-800 disabled:opacity-50"
                >
                    {isExporting ? 
                        <div className='flex relative items-center justify-center'>
                            <LoaderCircle className="animate-spin absolute scale-[1.2]" />
                            <span className="text-transparent">Export</span>
                        </div> 
                        : 'Export'
                    }
                </Button>
            </div>

            {/* Progress Bar */}
            {isExporting && (
                <div className="space-y-2">
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-xs text-neutral-400 text-center">
                        Exporting... {progress}%
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-red-400 text-sm font-medium">Export Failed</div>
                        <div className="text-red-300 text-xs mt-1">{error}</div>
                        {!hasOriginalFile && (
                            <div className="flex items-center gap-1 mt-2">
                                <Upload size={12} className="text-red-300" />
                                <a 
                                    href="/upload" 
                                    className="text-red-300 text-xs underline hover:text-red-200"
                                >
                                    Re-upload video
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success Message */}
            {videoUrl && !isExporting && (
                <div className="flex items-center justify-between p-2 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div>
                        <div className="text-green-400 text-sm font-medium">Export Complete!</div>
                        <div className="text-green-300 text-xs mt-1">Video downloaded successfully</div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            if (videoUrl) {
                                const link = document.createElement('a');
                                link.href = videoUrl;
                                link.download = `${currentProject?.name || 'video'}.mp4`;
                                link.click();
                            }
                        }}
                        className="text-green-400 border-green-500/50 hover:bg-green-500/10"
                    >
                        <Download size={14} className="mr-1" />
                        Download Again
                    </Button>
                </div>
            )}

            {/* Export Info/Status */}
            {!hasProject && (
                <div className="text-xs text-neutral-500 text-center">
                    Upload a video to enable export
                </div>
            )}
            
            {hasProject && !hasOriginalFile && (
                <div className="flex items-center justify-center gap-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <AlertCircle size={14} className="text-yellow-400" />
                    <div className="text-yellow-300 text-xs">
                        Original file missing - export disabled
                    </div>
                </div>
            )}

            {canExport && (
                <div className="text-xs text-neutral-400 text-center">
                    Ready to export with current settings
                </div>
            )}
        </div>
    );
}