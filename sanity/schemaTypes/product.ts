export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'price', title: 'Price', type: 'number' },
    { name: 'image', title: 'Image', type: 'image' },
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
      title: 'Size Variants',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Size & Inventory',
          fields: [
            {
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                layout: 'dropdown',
              },
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'quantity',
              title: 'Quantity in Stock',
              type: 'number',
              validation: (Rule: any) => Rule.min(0),
            },
          ],
        },
      ],
    },
  ],
}