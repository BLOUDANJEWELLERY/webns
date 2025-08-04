// /schemas/product.ts
export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'basePrice',
      title: 'Base Price (KWD)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    },
    {
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    },
    {
      name: 'sizes',
      title: 'Sizes & Inventory',
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
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              validation: (Rule) => Rule.min(0),
            },
          ],
        },
      ],
    },
    {
      name: 'sku',
      title: 'SKU',
      type: 'string',
      readOnly: true,
    },
  ],

  preview: {
    select: {
      title: 'title',
      media: 'image',
      sku: 'sku',
    },
    prepare({ title, media, sku }) {
      return {
        title,
        subtitle: sku ? `SKU: ${sku}` : 'SKU not set',
        media,
      }
    },
  },

  // Automatically generate SKU on product creation
  initialValue: async () => {
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000)
    return {
      sku: `SKU-${Date.now()}-${uniqueSuffix}`,
    }
  },
}