// /schemas/product.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'defaultImage',
      title: 'Default Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'White', value: 'white' },
          { title: 'Black', value: 'black' },
          { title: 'Red', value: 'red' },
          { title: 'Blue', value: 'blue' },
          { title: 'Green', value: 'green' },
          { title: 'Yellow', value: 'yellow' },
          { title: 'Brown', value: 'brown' },
          { title: 'Grey', value: 'grey' },
        ],
      },
    }),
    defineField({
      name: 'colorImages',
      title: 'Image for Each Color',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'color', title: 'Color', type: 'string' },
            { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }
          ]
        }
      ]
    }),
    defineField({
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
                list: [], // We'll populate this dynamically
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
                ],
              },
            },
            { name: 'sku', title: 'SKU', type: 'string', readOnly: true },
            { name: 'quantity', title: 'Quantity', type: 'number' },
            { name: 'priceOverride', title: 'Price Override', type: 'number' },
          ],
        },
      ],
    }),
    defineField({
      name: 'price',
      title: 'Base Price',
      type: 'number',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'price',
      media: 'defaultImage'
    }
  }
})