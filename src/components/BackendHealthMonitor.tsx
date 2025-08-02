// src/components/BackendHealthMonitor.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { apiService } from '@/lib/api';

interface HealthStatus {
  status: 'connected' | 'disconnected' | 'checking' | 'error';
  message: string;
  lastChecked: Date | null;
  serverInfo: {
    service?: string;
    version?: string;
  } | null;
}

interface BackendHealthMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export default function BackendHealthMonitor({ 
  className = '', 
  showDetails = false 
}: BackendHealthMonitorProps) {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking',
    message: 'Checking connection...',
    lastChecked: null,
    serverInfo: null,
  });

  const [autoCheck, setAutoCheck] = useState(true);

  const checkHealth = async () => {
    setHealth(prev => ({ ...prev, status: 'checking', message: 'Checking connection...' }));

    try {
      const response = await apiService.healthCheck();
      setHealth({
        status: 'connected',
        message: 'Backend connected',
        lastChecked: new Date(),
        serverInfo: {
          service: response.service,
          version: response.version,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setHealth({
        status: 'error',
        message: errorMessage,
        lastChecked: new Date(),
        serverInfo: null,
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up periodic health checks if auto-check is enabled
    let interval: NodeJS.Timeout;
    if (autoCheck) {
      interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCheck]);

  const getStatusIcon = () => {
    switch (health.status) {
      case 'connected':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'checking':
        return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
      default:
        return <WifiOff size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (health.status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600 text-white">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  if (!showDetails) {
    // Compact version - just show status icon and badge
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        {getStatusBadge()}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={health.status === 'checking'}
          className="h-6 w-6 p-0"
        >
          <RefreshCw size={12} className={health.status === 'checking' ? 'animate-spin' : ''} />
        </Button>
      </div>
    );
  }

  // Detailed version - full health monitor panel
  return (
    <div className={`p-4 bg-neutral-800 rounded-xl border border-neutral-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-200">Backend Status</h3>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-400">Message:</span>
          <span className={`text-right ${
            health.status === 'connected' ? 'text-green-400' : 
            health.status === 'error' ? 'text-red-400' : 
            'text-neutral-300'
          }`}>
            {health.message}
          </span>
        </div>

        {health.lastChecked && (
          <div className="flex justify-between">
            <span className="text-neutral-400">Last checked:</span>
            <span className="text-neutral-300">
              {health.lastChecked.toLocaleTimeString()}
            </span>
          </div>
        )}

        {health.serverInfo && (
          <>
            <div className="flex justify-between">
              <span className="text-neutral-400">Service:</span>
              <span className="text-neutral-300">{health.serverInfo.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Version:</span>
              <span className="text-neutral-300">{health.serverInfo.version}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-700">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-check"
            checked={autoCheck}
            onChange={(e) => setAutoCheck(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="auto-check" className="text-xs text-neutral-400">
            Auto-check
          </label>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={checkHealth}
          disabled={health.status === 'checking'}
          className="h-8"
        >
          <RefreshCw size={14} className={health.status === 'checking' ? 'animate-spin mr-2' : 'mr-2'} />
          Check Now
        </Button>
      </div>

      {/* Connection tips for errors */}
      {health.status === 'error' && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs mb-2">Connection troubleshooting:</p>
          <ul className="text-red-300 text-xs space-y-1">
            <li>• Ensure the backend server is running</li>
            <li>• Check if the API URL is correct</li>
            <li>• Verify network connectivity</li>
            <li>• Check browser console for CORS errors</li>
          </ul>
        </div>
      )}
    </div>
  );
}