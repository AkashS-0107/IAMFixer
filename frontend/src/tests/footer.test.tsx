import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Footer } from '../components/ui/footer';

describe('Footer Component', () => {
  it('renders brand name, SRE Console label, and tagline', () => {
    render(<Footer currentPath="/" />);

    expect(screen.getByText('IAMFixer')).toBeInTheDocument();
    expect(screen.getByText('SRE Console')).toBeInTheDocument();
    expect(screen.getByText(/Find the failure. Understand the cause. Fix it./i)).toBeInTheDocument();
    expect(screen.getByText('AWS Bedrock')).toBeInTheDocument();
  });

  it('triggers navigation when links are clicked', () => {
    const handleNavigate = vi.fn();
    render(<Footer onNavigate={handleNavigate} currentPath="/" />);

    const dashboardLink = screen.getByRole('button', { name: /Operations Console/i });
    fireEvent.click(dashboardLink);
    expect(handleNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('opens About modal when clicking About link', () => {
    render(<Footer currentPath="/" />);

    const aboutLink = screen.getByRole('button', { name: /About IAMFixer/i });
    fireEvent.click(aboutLink);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('About IAMFixer SRE Engine')).toBeInTheDocument();
  });
});
