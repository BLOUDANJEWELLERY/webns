// /schemas/product.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4
    }),

    defineField({
      name: 'defaultImage',
      title: 'Default Image',
      type: 'image',
      options: { hotspot: true }
    }),

    defineField({
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'colorName', title: 'Color Name', type: 'string' },
            { name: 'colorImage', title: 'Image for this Color', type: 'image', options: { hotspot: true } }
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
                list: [], // Will be populated dynamically via Studio custom input
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
                  { title: 'XXL', value: 'XXL' }
                ]
              }
            },
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              validation: Rule => Rule.min(0)
            },
            {
              name: 'sku',
              title: 'SKU',
              type: 'string'
            },
            {
              name: 'overridePrice',
              title: 'Override Price',
              type: 'number'
            }
          ]
        }
      ]
    }),

    defineField({
      name: 'price',
      title: 'Base Price',
      type: 'number',
      validation: Rule => Rule.min(0)
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 }
    })
  ]
})