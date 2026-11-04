import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Header from '../components/layout/Header';
import App from '../App';
import EditionBadge from '../components/common/EditionBadge';

describe('Navigation and Layout Shell', () => {
  it('renders Header brand and Java Edition badge', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getAllByText('MineAtlas')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Java Edition')[0]).toBeInTheDocument();
    expect(screen.getByText('Mobs')).toBeInTheDocument();
    expect(screen.getByText('Biomes')).toBeInTheDocument();
    expect(screen.getByText('Items & Blocks')).toBeInTheDocument();
    expect(screen.getByText('Structures')).toBeInTheDocument();
    expect(screen.getByText('About Data')).toBeInTheDocument();
  });

  it('renders EditionBadge with Java Edition styling by default', () => {
    render(<EditionBadge />);
    expect(screen.getByText('Java Edition')).toBeInTheDocument();
  });

  it('renders entire App with Home page initial route', async () => {
    render(<App />);
    expect(screen.getByText('Explore Minecraft Java Edition')).toBeInTheDocument();
    expect(screen.getByText('Core Explorers')).toBeInTheDocument();
  });
});
