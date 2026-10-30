import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/ui/Button.js';
import { Badge, PriorityBadge, StatusBadge } from '../components/ui/Badge.js';
import { Avatar } from '../components/ui/Avatar.js';
import { Input } from '../components/ui/Input.js';

describe('TaskFlow UI Component Tests', () => {
  describe('Button Component', () => {
    it('renders with children correctly', () => {
      render(<Button>Create Task</Button>);
      expect(screen.getByText('Create Task')).toBeDefined();
    });

    it('handles disabled state', () => {
      render(<Button disabled>Disabled Action</Button>);
      const btn = screen.getByText('Disabled Action').closest('button');
      expect(btn?.disabled).toBe(true);
    });
  });

  describe('Badge Components', () => {
    it('renders priority badges with appropriate text', () => {
      render(<PriorityBadge priority="urgent" />);
      expect(screen.getByText('Urgent')).toBeDefined();
    });

    it('renders status badges with appropriate text', () => {
      render(<StatusBadge status="in_progress" />);
      expect(screen.getByText('In Progress')).toBeDefined();
    });
  });

  describe('Avatar Component', () => {
    it('generates uppercase initials from user name', () => {
      render(<Avatar name="Alex Rivera" />);
      expect(screen.getByText('AR')).toBeDefined();
    });

    it('handles single name initial', () => {
      render(<Avatar name="Sarah" />);
      expect(screen.getByText('S')).toBeDefined();
    });
  });

  describe('Input Component', () => {
    it('renders with label and error message', () => {
      render(<Input label="Email Address" error="Invalid email address format" />);
      expect(screen.getByText('Email Address')).toBeDefined();
      expect(screen.getByText('Invalid email address format')).toBeDefined();
    });
  });
});
