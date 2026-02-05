/**
 * Body Mask Overlay
 *
 * Renders the segmentation mask (white body on transparent) over the photo
 * so the body outline follows the actual person contour from MediaPipe Selfie Segmentation.
 */

import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

interface BodyMaskOverlayProps {
  maskDataUrl: string;
  width: number;
  height: number;
  imageAspectRatio?: number;
}

/**
 * Same contain logic as BodyOutlineOverlay: mask is same size as the displayed photo,
 * so we use resizeMode="contain" and match the container to get correct alignment.
 */
const BodyMaskOverlay: React.FC<BodyMaskOverlayProps> = ({
  maskDataUrl,
  width,
  height,
  imageAspectRatio = 0.75,
}) => {
  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Image
        source={{ uri: maskDataUrl }}
        style={styles.maskImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskImage: {
    width: '100%',
    height: '100%',
    // White body on transparent from segmentation; edge acts as outline
  },
});

export default BodyMaskOverlay;
