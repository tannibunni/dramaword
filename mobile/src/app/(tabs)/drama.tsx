import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { dramaService, DramaSearchResult, UserDrama } from '@/services/dramaService';

export default function DramaScreen() {
  const insets = useSafeAreaInsets();
  const [dramas, setDramas] = useState<UserDrama[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'want' | 'watching' | 'completed' | 'dropped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DramaSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingIds, setAddingIds] = useState<number[]>([]);
  const [selectedDrama, setSelectedDrama] = useState<UserDrama | null>(null);

  // 新剧集表单状态
  const [newDrama, setNewDrama] = useState<{
    tmdbId?: number;
    title: string;
    originalTitle: string;
    type: 'tv' | 'movie';
    platform: string;
    notes: string;
    posterPath: string | null;
    releaseDate?: string;
    tmdbRating?: number;
  }>({
    title: '',
    originalTitle: '',
    type: 'tv',
    platform: '',
    notes: '',
    posterPath: null,
  });

  // 加载用户剧单
  useEffect(() => {
    loadUserDramas();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim()) {
        searchOnlineDrama(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const loadUserDramas = async () => {
    try {
      const userDramas = await dramaService.getUserDramas();
      setDramas(userDramas.map(d => ({ ...d, id: d._id })));
    } catch (error) {
      console.error('Failed to load user dramas:', error);
    }
  };

  // Online search function
  const searchOnlineDrama = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await dramaService.searchDrama(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('搜索失败', '请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: DramaSearchResult) => {
    setNewDrama({
      tmdbId: result.id,
      title: result.title,
      originalTitle: result.originalTitle || '',
      type: result.type,
      platform: '',
      notes: result.overview || '',
      posterPath: result.posterPath || null,
      releaseDate: result.releaseDate,
      tmdbRating: result.rating,
    });
    setShowAddModal(true);
  };

  const addDramaFromSearch = async (item: DramaSearchResult) => {
    const isAlreadyAdded = dramas.some(d => d.tmdbId === item.id);
    if (isAlreadyAdded) {
      return;
    }

    setAddingIds(prev => [...prev, item.id]);

    try {
      const dramaData: Partial<UserDrama> = {
        tmdbId: item.id,
        title: item.title,
        originalTitle: item.originalTitle,
        type: item.type,
        posterPath: item.posterPath || undefined,
        overview: item.overview,
        releaseDate: item.releaseDate,
        tmdbRating: item.rating,
        status: 'want',
      };

      await dramaService.saveDrama(dramaData);
      loadUserDramas();
    } catch (error) {
      console.error('Failed to add drama from search:', error);
      Alert.alert('添加失败', '请稍后重试');
    } finally {
      setAddingIds(prev => prev.filter(id => id !== item.id));
    }
  };

  const addDrama = async () => {
    if (!newDrama.title.trim()) {
      Alert.alert('提示', '请输入剧名');
      return;
    }

    try {
      // 准备要发送到API的数据
      const dramaData: Partial<UserDrama> = {
        tmdbId: newDrama.tmdbId,
        title: newDrama.title.trim(),
        originalTitle: newDrama.originalTitle.trim() || undefined,
        type: newDrama.type,
        posterPath: newDrama.posterPath || undefined,
        overview: newDrama.notes,
        releaseDate: newDrama.releaseDate,
        tmdbRating: newDrama.tmdbRating,
        platform: newDrama.platform.trim() || undefined,
        notes: newDrama.notes.trim() || undefined,
      };

      await dramaService.saveDrama(dramaData);
      setShowAddModal(false);
      resetForm();
      loadUserDramas(); // 重新加载剧单
      Alert.alert('成功', '剧集已添加到剧单');
    } catch (error) {
      console.error('Failed to add drama:', error);
      Alert.alert('添加失败', '请稍后重试');
    }
  };

  const resetForm = () => {
    setNewDrama({
      title: '',
      originalTitle: '',
      type: 'tv',
      platform: '',
      notes: '',
      posterPath: null,
    });
  };

  const updateDramaStatus = async (id: string, status: UserDrama['status']) => {
    const originalDramas = dramas;
    
    // Optimistically update the UI
    setDramas(prevDramas =>
      prevDramas.map(drama =>
        drama.id === id ? { ...drama, status: status } : drama
      )
    );

    try {
      // Make the API call
      await dramaService.updateDrama(id, { status });
    } catch (error) {
      // If the API call fails, revert the UI and show an error
      console.error('Failed to update drama status:', error);
      Alert.alert('更新失败', '请稍后重试');
      setDramas(originalDramas);
    }
  };

  const deleteDrama = async (id: string) => {
            try {
              await dramaService.deleteDrama(id);
              setDramas(prevDramas => prevDramas.filter(drama => drama.id !== id));
            } catch (error) {
              console.error('Failed to delete drama:', error);
              Alert.alert('删除失败', '请稍后重试');
            }
  };

  const getStatusColor = (status: UserDrama['status']) => {
    switch (status) {
      case 'want': return '#F59E0B';
      case 'watching': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'dropped': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: UserDrama['status']) => {
    switch (status) {
      case 'want': return '想看';
      case 'watching': return '观看中';
      case 'completed': return '已看完';
      case 'dropped': return '已弃剧';
      default: return '未知';
    }
  };

  const getTypeText = (type: UserDrama['type']) => {
    switch (type) {
      case 'tv': return '电视剧';
      case 'movie': return '电影';
      default: return '其他';
    }
  };

  // 过滤本地剧单
  const filteredDramas = dramas.filter(drama => {
    const matchesStatus = filterStatus === 'all' || drama.status === filterStatus;
    return matchesStatus;
  });

  const renderDramaItem = ({ item }: { item: UserDrama }) => (
    <TouchableOpacity onPress={() => setSelectedDrama(item)} activeOpacity={0.8}>
      <View style={styles.dramaCard}>
        <View style={{ flexDirection: 'row' }}>
          {/* Poster */}
          {item.posterPath ? (
            <Image source={{ uri: item.posterPath }} style={styles.posterImage} />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Feather name="image" size={24} color="#CCCCCC" />
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={styles.dramaHeader}>
              <View style={styles.dramaInfo}>
                <Text style={styles.dramaTitle} numberOfLines={2}>{item.title}</Text>
                {item.originalTitle && (
                  <Text style={styles.originalTitle} numberOfLines={1}>{item.originalTitle}</Text>
                )}
              </View>
              <View style={styles.dramaActions}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: getStatusColor(item.status) }]}
                  onPress={() => {
                    const statuses: UserDrama['status'][] = ['want', 'watching', 'completed', 'dropped'];
                    const currentIndex = statuses.indexOf(item.status);
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    updateDramaStatus(item.id, nextStatus);
                  }}
                >
                  <Text style={styles.statusButtonText}>{getStatusText(item.status)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteDrama(item.id)}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.dramaMeta}>
              <Text style={styles.typeText}>{getTypeText(item.type)}</Text>
              {item.platform && (
                <Text style={styles.platformText}>· {item.platform}</Text>
              )}
              {item.releaseDate && (
                <Text style={styles.releaseDateText}>· {new Date(item.releaseDate).getFullYear()}</Text>
              )}
            </View>

            {item.overview && (
              <Text style={styles.overviewText} numberOfLines={2}>{item.overview}</Text>
            )}

            {item.notes && (
              <Text style={styles.notesText}>{item.notes}</Text>
            )}

            {item.tmdbRating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>TMDB评分: {item.tmdbRating.toFixed(1)}</Text>
                <Feather name="star" size={14} color="#F59E0B" />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: DramaSearchResult }) => {
    const isAdded = dramas.some(d => d.tmdbId === item.id);
    const isAdding = addingIds.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => addDramaFromSearch(item)}
        activeOpacity={0.7}
        disabled={isAdded || isAdding}
      >
        {/* Poster */}
        {item.posterPath ? (
          <Image source={{ uri: item.posterPath }} style={styles.posterImage} />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Feather name="image" size={24} color="#CCCCCC" />
          </View>
        )}
        
        {/* Info Column */}
        <View style={styles.searchResultInfo}>
          {/* Top Row: Text info and Add Icon */}
          <View style={styles.searchResultTop}>
            <View style={styles.searchResultTextContainer}>
              <Text style={styles.searchResultTitle} numberOfLines={1}>{item.title}</Text>
              {item.originalTitle && item.originalTitle !== item.title && (
                <Text style={styles.searchResultOriginalTitle} numberOfLines={1}>{item.originalTitle}</Text>
              )}
              <View style={styles.searchResultMeta}>
                <Text style={styles.searchResultType}>{getTypeText(item.type)}</Text>
                {item.releaseDate && (
                  <Text style={styles.searchResultYear}>· {new Date(item.releaseDate).getFullYear()}</Text>
                )}
                {item.rating && (
                  <Text style={styles.searchResultRating}>· ⭐ {item.rating.toFixed(1)}</Text>
                )}
              </View>
            </View>
            <View style={styles.addIconContainer}>
              {isAdding ? (
                <ActivityIndicator size="small" color="#999999" />
              ) : isAdded ? (
                <Feather name="check" size={24} color="#10B981" />
              ) : (
                <Feather name="plus" size={24} color="#3B82F6" />
              )}
            </View>
          </View>

          {/* Bottom: Overview */}
          {item.overview && (
            <Text style={styles.searchResultOverview} numberOfLines={2}>{item.overview}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>我的剧单</Text>
      </View>

      {/* 统一搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#999999" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索在线剧集..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
              <Feather name="x-circle" size={18} color="#999999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim().length > 0 ? (
        <>
          {/* 手动添加入口 */}
          <View style={styles.manualAddContainer}>
            <Text style={styles.manualAddText}>搜不到？ </Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Text style={styles.manualAddLink}>点击手动添加</Text>
            </TouchableOpacity>
          </View>
          
          {/* 在线搜索结果 */}
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="large" color="#111111" />
                <Text style={styles.searchingText}>搜索中...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={item => item.id.toString()}
                style={styles.searchResultsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  searchResults.length === 0 && !isSearching ? (
                    <View style={styles.noResultsContainer}>
                      <Feather name="search" size={48} color="#CCCCCC" />
                      <Text style={styles.noResultsText}>未找到相关剧集</Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </>
      ) : (
        <>
          {/* 筛选栏 */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {[
              { key: 'all', text: '全部' },
              { key: 'want', text: '想看' },
              { key: 'watching', text: '观看中' },
              { key: 'completed', text: '已看完' },
              { key: 'dropped', text: '已弃剧' },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  filterStatus === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 本地剧单列表 */}
          <FlatList
            data={filteredDramas}
            renderItem={renderDramaItem}
            keyExtractor={item => item.id}
            style={styles.dramaList}
            contentContainerStyle={styles.dramaListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="play" size={48} color="#CCCCCC" />
                <Text style={styles.emptyTitle}>剧单为空</Text>
                <Text style={styles.emptySubtitle}>在上方搜索并添加你想看的剧集</Text>
              </View>
            }
          />
        </>
      )}

      {/* 添加剧集弹窗 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>添加剧集</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Feather name="x" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>剧名 *</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入剧名"
                value={newDrama.title}
                onChangeText={(text) => setNewDrama({...newDrama, title: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>原名</Text>
              <TextInput
                style={styles.input}
                placeholder="原名（可选）"
                value={newDrama.originalTitle}
                onChangeText={(text) => setNewDrama({...newDrama, originalTitle: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>类型</Text>
              <View style={styles.typeButtons}>
                {[
                  { key: 'tv', text: '电视剧' },
                  { key: 'movie', text: '电影' },
                ].map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      newDrama.type === type.key && styles.typeButtonActive
                    ]}
                    onPress={() => setNewDrama({...newDrama, type: type.key as any})}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newDrama.type === type.key && styles.typeButtonTextActive
                    ]}>
                      {type.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>观看平台</Text>
              <TextInput
                style={styles.input}
                placeholder="如：Netflix、爱奇艺等"
                value={newDrama.platform}
                onChangeText={(text) => setNewDrama({...newDrama, platform: text})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>备注</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="添加备注..."
                value={newDrama.notes}
                onChangeText={(text) => setNewDrama({...newDrama, notes: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={addDrama}
            >
              <Text style={styles.saveButtonText}>添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Drama Detail Modal */}
      <Modal
        visible={!!selectedDrama}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDrama(null)}
      >
        {selectedDrama && (
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>剧集详情</Text>
              <TouchableOpacity onPress={() => setSelectedDrama(null)}>
                <Feather name="x" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
              {selectedDrama.posterPath && (
                <Image source={{ uri: selectedDrama.posterPath }} style={styles.detailPosterImage} />
              )}
              <Text style={styles.detailTitle}>{selectedDrama.title}</Text>
              {selectedDrama.originalTitle && (
                <Text style={styles.detailOriginalTitle}>{selectedDrama.originalTitle}</Text>
              )}
              <View style={styles.detailMeta}>
                <Text style={styles.typeText}>{getTypeText(selectedDrama.type)}</Text>
                {selectedDrama.releaseDate && (
                  <Text style={styles.releaseDateText}> · {new Date(selectedDrama.releaseDate).getFullYear()}</Text>
                )}
                {selectedDrama.tmdbRating && (
                  <Text style={styles.ratingText}> · ⭐ {selectedDrama.tmdbRating.toFixed(1)}</Text>
                )}
              </View>
              {selectedDrama.overview && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>简介</Text>
                  <Text style={styles.detailSectionContent}>{selectedDrama.overview}</Text>
                </View>
              )}
              {selectedDrama.platform && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>观看平台</Text>
                  <Text style={styles.detailSectionContent}>{selectedDrama.platform}</Text>
                </View>
              )}
              {selectedDrama.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>我的备注</Text>
                  <Text style={styles.detailSectionContent}>{selectedDrama.notes}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111111',
  },
  clearSearchButton: {
    padding: 4,
  },
  manualAddContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  manualAddText: {
    fontSize: 14,
    color: '#666666',
  },
  manualAddLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  posterImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  posterPlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  searchResultTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  searchResultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
  },
  searchResultOriginalTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchResultType: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  searchResultYear: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  searchResultRating: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  searchResultOverview: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
  addIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexGrow: 0,
  },
  filterContent: {
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#111111',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  dramaList: {
    flex: 1,
  },
  dramaListContent: {
    padding: 24,
  },
  dramaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dramaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dramaInfo: {
    flex: 1,
    marginRight: 16,
  },
  dramaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  originalTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  dramaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typeText: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  platformText: {
    fontSize: 12,
    color: '#666666',
  },
  releaseDateText: {
    fontSize: 12,
    color: '#666666',
  },
  dramaActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    fontStyle: 'italic',
    overflow: 'hidden',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666666',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Styles for Detail Modal
  detailModalContent: {
    flex: 1,
    padding: 24,
  },
  detailPosterImage: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#F0F0F0',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },
  detailOriginalTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  detailSectionContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
}); 