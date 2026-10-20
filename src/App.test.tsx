import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { renderWithProviders } from './test/render';

describe('App', () => {
  it('renders the console shell and the default list', async () => {
    renderWithProviders(<App />);

    expect(screen.getByRole('link', { name: 'Notification Console' })).toBeInTheDocument();
    expect(await screen.findByText('No notifications with this status.')).toBeInTheDocument();
  });
});
