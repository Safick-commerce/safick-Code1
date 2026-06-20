import { View, FlatList, StyleSheet, ListRenderItem, Dimensions } from "react-native";
import LivePostCard from "./LivePostCard";
import { LivePost } from "../../types";
import { memo, useCallback, useMemo, ReactElement } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LivePostsGridProps {
  posts: LivePost[];
  postsPerRow?: number;
  ListHeaderComponent?: ReactElement;
  ListFooterComponent?: ReactElement;
  ListEmptyComponent?: ReactElement | null;
  onScrollBeginDrag?: () => void;
  onPostImageLoad?: () => void;
  /** When true, live rows stay mounted but hidden so images can load underneath a skeleton. */
  gridLoading?: boolean;
}

function LivePostsGrid({
  posts,
  postsPerRow = 2,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onScrollBeginDrag,
  onPostImageLoad,
  gridLoading = false,
}: LivePostsGridProps) {
  // Calculate card width based on screen size
  // Account for: horizontal padding (10), gaps between cards (12), and margins (6 * 2 per card)
  const cardWidth = useMemo(() => {
    const horizontalPadding = -10;
    const rowPadding = 6 * 2;
    const cardMargin = 2 * 2;
    const gapBetweenCards = 8;
    
    const availableWidth = SCREEN_WIDTH - horizontalPadding - rowPadding;
    const totalMarginsAndGaps = (cardMargin * postsPerRow) + (gapBetweenCards * (postsPerRow - 1));
    return (availableWidth - totalMarginsAndGaps) / postsPerRow;
  }, [postsPerRow]);

  // Group posts into rows
  const groupedPosts: LivePost[][] = [];
  for (let i = 0; i < posts.length; i += postsPerRow) {
    groupedPosts.push(posts.slice(i, i + postsPerRow));
  }

  const renderRow: ListRenderItem<LivePost[]> = useCallback(
    ({ item: rowPosts }) => (
      <View style={[styles.row, gridLoading && styles.rowHidden]}>
        {rowPosts.map((post) => (
          <LivePostCard key={post.id} post={post} cardWidth={cardWidth} onImageLoad={onPostImageLoad} />
        ))}
      </View>
    ),
    [cardWidth, gridLoading, onPostImageLoad],
  );

  const keyExtractor = useCallback((item: LivePost[], index: number) => 
    `row-${index}`, []);

  return (
    <FlatList
      data={groupedPosts}
      renderItem={renderRow}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={5}
      windowSize={5}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={onScrollBeginDrag}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginTop: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rowHidden: {
    opacity: 0,
  },
});

export default memo(LivePostsGrid);
