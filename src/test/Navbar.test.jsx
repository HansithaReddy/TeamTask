import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Mock the useAuth hook
vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    user: {
      id: '1',
      name: 'Test User',
      role: 'user'
    }
  })
}));

const mockUser = {
  id: '1',
  name: 'Test User',
  role: 'user'
};

describe('Navbar', () => {
  it('renders user initial in avatar', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Check for the user's initial "T" in the avatar
    expect(screen.getByText('T')).toBeInTheDocument();
    
    // Check for the TeamTask logo
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
  });

  // Add more tests as needed
});