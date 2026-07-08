import { useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import * as Icons from '../index';
import type { IconProps } from '../Icon';

type IconComponent = ComponentType<IconProps>;

const iconEntries = Object.entries(Icons).filter(
  (entry): entry is [string, IconComponent] => entry[0].startsWith('Icon'),
);

function IconCatalog() {
  const [query, setQuery] = useState('');
  const filtered = iconEntries.filter(([name]) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <input
        type="search"
        placeholder={`Search ${iconEntries.length} icons...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: 8,
          marginBottom: 16,
          fontSize: 14,
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map(([name, Icon]) => (
          <div
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: 16,
              border: '1px solid #e2e2e2',
              borderRadius: 8,
            }}
          >
            <Icon size={24} />
            <code style={{ fontSize: 11, textAlign: 'center', wordBreak: 'break-all' }}>
              {name}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Icons/Catalog',
};
export default meta;

export const Catalog: StoryObj = {
  render: () => <IconCatalog />,
};

export const Playground: StoryObj<IconProps> = {
  args: { size: 48, color: '#1a56db' },
  argTypes: {
    size: { control: { type: 'range', min: 12, max: 128, step: 4 } },
    color: { control: 'color' },
  },
  render: (args) => <Icons.IconArrowRight {...args} />,
};
