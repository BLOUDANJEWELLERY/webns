// product.js (Sanity schema)
export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'defaultImage',
      title: 'Default Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'colorName',
              title: 'Color Name',
              type: 'string',
            },
            {
              name: 'image',
              title: 'Image for Color',
              type: 'image',
              options: { hotspot: true },
            }
          ]
        }
      ]
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
              name: 'color',
              title: 'Color',
              type: 'string',
              options: {
                list: ({ parent, document }) => {
                  // Pull colors from the main colors field
                  if (!document?.colors) return [];
                  return document.colors.map(c => ({
                    title: c.colorName,
                    value: c.colorName
                  }));
                }
              }
            },
            {
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: [
                  { title: 'XS', value: 'XS' },
                  { title: 'S', value: 'S' },
                  { title: 'M', value: 'M' },
                  { title: 'L', value: 'L' },
                  { title: 'XL', value: 'XL' },
                  { title: 'XXL', value: 'XXL' },
                ]
              }
            },
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number'
            }
          ]
        }
      ]
    }
  ]
}