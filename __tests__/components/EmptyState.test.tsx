import React from 'react';
import { renderAsync, fireEvent } from '@testing-library/react-native';
import EmptyState from '@/components/EmptyState';

describe('fieldlens/components/EmptyState', () => {
  it('should render title and description', async () => {
    const { getByText } = await renderAsync(
      <EmptyState title="No Tasks" description="Complete your first field task to get started" />
    );
    expect(getByText('No Tasks')).toBeTruthy();
    expect(getByText('Complete your first field task to get started')).toBeTruthy();
  });

  it('should render action button when actionLabel and onAction are provided', async () => {
    const onAction = jest.fn();
    const { getByText } = await renderAsync(
      <EmptyState
        title="No Tasks"
        description="Start your training journey"
        actionLabel="Browse Tasks"
        onAction={onAction}
      />
    );
    const button = getByText('Browse Tasks');
    expect(button).toBeTruthy();
  });

  it('should not render action button when actionLabel is missing', async () => {
    const { queryByText } = await renderAsync(
      <EmptyState title="No Tasks" description="No tasks available" />
    );
    expect(queryByText('Browse Tasks')).toBeNull();
  });

  it('should call onAction when action button is pressed', async () => {
    const onAction = jest.fn();
    const { getByText } = await renderAsync(
      <EmptyState
        title="No Tasks"
        description="Start your training journey"
        actionLabel="Browse Tasks"
        onAction={onAction}
      />
    );
    fireEvent.press(getByText('Browse Tasks'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should have correct accessibility attributes on action button', async () => {
    const onAction = jest.fn();
    const { getByRole } = await renderAsync(
      <EmptyState
        title="Empty"
        description="Nothing here"
        actionLabel="Add Item"
        onAction={onAction}
      />
    );
    const button = getByRole('button');
    expect(button).toBeTruthy();
  });
});
