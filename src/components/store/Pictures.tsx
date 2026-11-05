import Image from 'next/image'
import React from 'react'

import type { Media } from '@/payload-types'

type PictureProps = {
  image: Media
  sizes: string
  className?: string
  priority?: boolean
}

export const Picture = ({ image, sizes, className = '', priority }: PictureProps) => (
  <Image
    src={image.url!}
    alt={image.alt}
    width={image.width ?? 1200}
    height={image.height ?? 1300}
    sizes={sizes}
    priority={priority}
    className={className}
  />
)

/** One image per mode. Which one shows is pure CSS, so there is nothing to hydrate. */
export const ModePicture = ({
  day,
  night,
  ...rest
}: Omit<PictureProps, 'image'> & { day: Media; night: Media }) => {
  if (day.id === night.id) return <Picture image={day} {...rest} />
  return (
    <>
      <Picture image={day} {...rest} className={`only-day ${rest.className ?? ''}`} />
      <Picture image={night} {...rest} className={`only-night ${rest.className ?? ''}`} />
    </>
  )
}
