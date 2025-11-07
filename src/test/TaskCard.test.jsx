import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskCard from '../components/TaskCard';
import { BrowserRouter } from 'react-router-dom';

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

// Mock the AuthContext
const mockUser = {
  id: '1',
  name: 'Test User',
  role: 'user'
};

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    status: 'To Do',
    priority: 'medium',
    assignee: '1',
    due: new Date().toISOString(),
    assignedBy: 'Admin User'
  };

  const renderTaskCard = (task = mockTask) => {
    return render(
      <BrowserRouter>
        <TaskCard 
          task={task}
          onUpdate={() => {}}
          onDelete={() => {}}
          onComment={() => {}}
        />
      </BrowserRouter>
    );
  };

  it('renders task title correctly', () => {
    renderTaskCard();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders task priority', () => {
    renderTaskCard();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders task status', () => {
    renderTaskCard();
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('renders assigned by information', () => {
    renderTaskCard();
    expect(screen.getByText('Assigned by: Admin User')).toBeInTheDocument();
  });
});