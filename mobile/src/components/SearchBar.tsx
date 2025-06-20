import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WordSearchResult } from '@/types/word';
import { wordService } from '@/services/wordService';
import { generateShadow } from '@/styles/common';

interface SearchBarProps {
  onWordSelect: (word: string) => void;
  placeholder?: string;
}

const { width } = Dimensions.get('window');

export default function SearchBar({ onWordSelect, placeholder = "搜索单词或中文释义..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WordSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const searchWords = async () => {
      if (query.trim().length < 1) {
        setResults([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      setShowSuggestions(true);
      
      try {
        const searchResults = await wordService.searchWords(query.trim());
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchWords, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleWordSelect = (word: string) => {
    setQuery('');
    setShowSuggestions(false);
    setIsFocused(false);
    onWordSelect(word);
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
  };

  const renderSearchResult = ({ item }: { item: WordSearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleWordSelect(item.word)}
      activeOpacity={0.6}
    >
      <View style={styles.resultContent}>
        <View style={styles.wordInfo}>
          <Text style={styles.resultWord}>{item.word}</Text>
          <Text style={styles.resultTranslations} numberOfLines={1}>
            {item.translations.join(' · ')}
          </Text>
        </View>
        
        <View style={styles.resultMeta}>
          {item.frequency && item.frequency > 0 ? (
            <View style={styles.frequencyContainer}>
              <Feather name="trending-up" color="#22C55E" size={12} />
              <Text style={styles.frequencyText}>{item.frequency}</Text>
            </View>
          ) : (
            <Feather name="arrow-up-right" color="#E5E7EB" size={16} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 搜索输入框 */}
      <View style={[
        styles.searchContainer,
        isFocused && styles.searchContainerFocused,
        showSuggestions && styles.searchContainerWithSuggestions
      ]}>
        <Feather 
          name="search"
          color={isFocused ? "#111111" : "#CCCCCC"} 
          size={18} 
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#CCCCCC"
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // 延迟失焦，确保点击建议项能正常工作
            setTimeout(() => {
              setIsFocused(false);
              if (query.length === 0) {
                setShowSuggestions(false);
              }
            }, 150);
          }}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (query.trim()) {
              handleWordSelect(query.trim());
            }
          }}
        />
        
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" color="#CCCCCC" size={16} />
          </TouchableOpacity>
        )}
      </View>

      {/* 搜索建议下拉菜单 - 紧贴搜索框 */}
      {showSuggestions && (isFocused || results.length > 0) && (
        <View style={styles.suggestionsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>搜索中...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderSearchResult}
              keyExtractor={(item, index) => `${item.word}-${index}`}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            />
          ) : query.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>未找到相关单词</Text>
              <TouchableOpacity
                style={styles.addWordButton}
                onPress={() => handleWordSelect(query)}
                activeOpacity={0.8}
              >
                <Feather name="search" size={14} color="#FFFFFF" />
                <Text style={styles.addWordText}>查找 "{query}"</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    // 确保搜索容器有足够的层级，但不会过高
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56,
    // 搜索框本身的层级
    zIndex: 101,
  },
  searchContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    ...generateShadow(3),
  },
  searchContainerWithSuggestions: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  searchIcon: {
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingVertical: 0,
    fontWeight: '400',
    lineHeight: 20,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  // 修改：下拉菜单紧贴搜索框，不使用绝对定位
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    maxHeight: 320,
    overflow: 'hidden',
    zIndex: 102,
    marginTop: -1,
    ...generateShadow(4),
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
  resultsList: {
    maxHeight: 320,
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
  },
  wordInfo: {
    flex: 1,
    marginRight: 16,
  },
  resultWord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  resultTranslations: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '400',
    lineHeight: 18,
  },
  resultMeta: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  frequencyText: {
    fontSize: 11,
    color: '#22C55E',
    marginLeft: 4,
    fontWeight: '600',
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
    fontWeight: '500',
  },
  addWordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addWordText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});