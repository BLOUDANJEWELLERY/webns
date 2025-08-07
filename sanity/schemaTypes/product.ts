export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'price', title: 'Base Price', type: 'number' },
    {
      name: 'defaultImage',
      title: 'Default Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used when no color variant is selected.',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
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
            {
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
              },
            },
            {
              name: 'color',
              title: 'Color',
              type: 'string',
              options: {
                list: ['Black', 'White', 'Beige', 'Brown', 'Navy', 'Olive', 'Gold'],
              },
            },
            {
              name: 'images',
              title: 'Images for this Variant',
              type: 'array',
              of: [{ type: 'image', options: { hotspot: true } }],
              options: { layout: 'grid' },
            },
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
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
            },
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