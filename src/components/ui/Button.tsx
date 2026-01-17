import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 999, 
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  primary: {
    backgroundColor: Colors.primary,
    borderColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: Colors.gray[100],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    letterSpacing: 1.2,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.text.primary,
  },
  outlineText: {
    color: Colors.text.primary,
  },
});

const variantStyles: Record<NonNullable<ButtonProps['variant']>, ViewStyle> = {
  primary: styles.primary,
  secondary: styles.secondary,
  outline: styles.outline,
};