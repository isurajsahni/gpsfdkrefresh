const VariationSelector = ({ variations, selected, onSelect }) => {
  // Extract unique sizes from variations
  const sizes = [...new Set(variations.map(v => v.size))];

  if (sizes.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map(size => {
        const isActive = selected?.size === size;
        return (
          <button
            key={size}
            onClick={() => {
              const match = variations.find(v => v.size === size);
              if (match) onSelect(match);
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-300 ${
              isActive
                ? 'border-accent bg-accent text-white shadow-md shadow-accent/25'
                : 'border-gray-200 bg-white text-gray-600 hover:border-accent/50 hover:text-accent'
            }`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
};

export default VariationSelector;
