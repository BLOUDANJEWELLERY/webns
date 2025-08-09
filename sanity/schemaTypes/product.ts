// schemas/product.ts
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Base Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'defaultImage',
      title: 'Default Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),

    // ✅ Colors section
    defineField({
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'color', title: 'Color Name', type: 'string' },
            { name: 'image', title: 'Color Image', type: 'image', options: { hotspot: true } },
          ],
        },
      ],
    }),

    // ✅ Variants without image
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
                list: [
                  { title: 'Red', value: 'red' },
                  { title: 'Blue', value: 'blue' },
                  { title: 'Green', value: 'green' },
                  // Add more or pull dynamically if needed
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'size',
              title: 'Size',
              type: 'string',
              options: {
                list: [
                  { title: 'Small', value: 'S' },
                  { title: 'Medium', value: 'M' },
                  { title: 'Large', value: 'L' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'sku',
              title: 'SKU',
              type: 'string',
              readOnly: true,
              initialValue: () => `SKU-${Date.now()}`,
            },
            {
              name: 'quantity',
              title: 'Quantity',
              type: 'number',
              validation: (Rule) => Rule.min(0),
            },
            {
              name: 'overridePrice',
              title: 'Override Price',
              type: 'number',
            },
          ],
        },
      ],
    }),
  ],
})