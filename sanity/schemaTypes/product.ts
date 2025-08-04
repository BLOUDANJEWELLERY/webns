export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'price', title: 'Price', type: 'number' },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    },
    { name: 'description', title: 'Description', type: 'text' },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'size', title: 'Size', type: 'string' },
            { name: 'color', title: 'Color', type: 'string' },
            {
              name: 'sku',
              title: 'SKU',
              type: 'string',
              readOnly: true,
              initialValue: (parent, context) => {
                const timestamp = Date.now().toString(36).toUpperCase()
                const base = context.document?.title?.substring(0, 3).toUpperCase() || 'SKU'
                return `${base}-${timestamp}`
              },
            },
            { name: 'quantity', title: 'Quantity', type: 'number' },
            {
              name: 'overridePrice',
              title: 'Override Price',
              type: 'number',
              description: 'Optional override price for this variant.',
            },
          ],
        },
      ],
    },
  ],
}