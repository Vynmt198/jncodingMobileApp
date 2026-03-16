import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';

export interface SelectOption<T extends string | number = string> {
  label: string;
  value: T;
}

interface SelectProps<T extends string | number = string> {
  label?: string;
  placeholder?: string;
  value: T | '';
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  containerStyle?: ViewStyle;
}

export function Select<T extends string | number = string>({
  label,
  placeholder = 'Chọn',
  value,
  options,
  onChange,
  containerStyle,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);

  const handlePressOption = (optionValue: T) => (e: GestureResponderEvent) => {
    e.preventDefault();
    setOpen(false);
    onChange(optionValue);
  };

  const selected = options.find(o => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.selectBox}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.valueText, !selected && styles.placeholderText]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={item => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handlePressOption(item.value)}
                >
                  <Text style={styles.optionLabel}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING[4],
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING[3],
    height: 48,
  },
  valueText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
  placeholderText: {
    color: COLORS.gray400,
  },
  chevron: {
    color: COLORS.gray400,
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: SPACING[6],
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionRow: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
});

