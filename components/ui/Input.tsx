import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const borderColor = error ? '#D32F2F' : isFocused ? '#E8711A' : '#3A3A3C';

  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && (
        <Text style={{ fontSize: 14, color: '#EBEBF5', fontWeight: '600' }}>{label}</Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#2C2C2E',
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={isFocused ? '#E8711A' : '#8E8E93'} />
        )}
        <TextInput
          {...textInputProps}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor="#636366"
          style={[
            {
              flex: 1,
              paddingVertical: 13,
              fontSize: 15,
              color: '#FFFFFF',
            },
            textInputProps.style,
          ]}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color="#8E8E93"
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="alert-circle" size={13} color="#D32F2F" />
          <Text style={{ fontSize: 12, color: '#D32F2F' }}>{error}</Text>
        </View>
      )}
      {hint && !error && (
        <Text style={{ fontSize: 12, color: '#636366' }}>{hint}</Text>
      )}
    </View>
  );
}
