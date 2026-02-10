/**
 * Crop image to the region that corresponds to the dotted body-guide circle on screen.
 * Circle is 55% of screen width and height, centered. Returns the cropped URI, or original on failure.
 */

import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const CIRCLE_FRACTION = 0.55;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export async function cropToCircleRegion(uri: string): Promise<string> {
  try {
    const { width: imageWidth, height: imageHeight } = await getImageSize(uri);
    const cropWidth = Math.floor(CIRCLE_FRACTION * imageWidth);
    const cropHeight = Math.floor(CIRCLE_FRACTION * imageHeight);
    if (cropWidth <= 0 || cropHeight <= 0) return uri;

    const originX = Math.max(0, Math.floor((imageWidth - cropWidth) / 2));
    const originY = Math.max(0, Math.floor((imageHeight - cropHeight) / 2));
    const width = Math.min(cropWidth, imageWidth - originX);
    const height = Math.min(cropHeight, imageHeight - originY);
    if (width <= 0 || height <= 0) return uri;

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX, originY, width, height } }],
      { compress: 1 }
    );
    return result.uri;
  } catch (error) {
    console.warn('Crop to circle region failed, using original:', error);
    return uri;
  }
}
