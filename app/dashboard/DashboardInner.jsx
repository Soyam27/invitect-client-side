'use client';
import { useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../../components/LoaderComponent';
import FloatingGlassMorphNavbar from '../../components/Navbar';

export default function DashboardInner() {
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', photoURL: '' });
  const [hits, setHits] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [expandedHit, setExpandedHit] = useState(null);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/');
        return;
      }

      setUserInfo({ name: user.displayName || 'User', email: user.email || '', photoURL: user.photoURL || '' });

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL + '/dashboard'}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const fetchedHits = data.hits || [];

        const mappedHits = fetchedHits.map((hit) => {
          const defaultThumbnail = '/default-thumbnail.png';

          const video1 = hit.video1
            ? {
                title: hit.video1.title || hit.video1.videoTitle || 'Unknown Video',
                thumbnail: hit.video1.thumbnail || defaultThumbnail,
                positive: hit.video1.positive ?? hit.video1.analysis?.positive ?? 0,
                neutral: hit.video1.neutral ?? hit.video1.analysis?.neutral ?? 0,
                negative: hit.video1.negative ?? hit.video1.analysis?.negative ?? 0,
              }
            : null;

          const video2 = hit.video2
            ? {
                title: hit.video2.title || hit.video2.videoTitle || 'Unknown Video',
                thumbnail: hit.video2.thumbnail || defaultThumbnail,
                positive: hit.video2.positive ?? hit.video2.analysis?.positive ?? 0,
                neutral: hit.video2.neutral ?? hit.video2.analysis?.neutral ?? 0,
                negative: hit.video2.negative ?? hit.video2.analysis?.negative ?? 0,
              }
            : null;

          const recommended = (hit.recommended || []).map((video) => ({
            title: video.title || video.videoTitle || 'Unknown Video',
            thumbnail: video.thumbnail || defaultThumbnail,
          }));

          // Normalize timestamp
          let rawTs = hit.timestamp;
          let tsSeconds;
          if (typeof rawTs === 'number') {
            tsSeconds = rawTs > 1e12 ? Math.floor(rawTs / 1000) : rawTs;
          } else if (rawTs && typeof rawTs === 'object') {
            if (typeof rawTs.seconds === 'number') tsSeconds = rawTs.seconds;
            else if (typeof rawTs._seconds === 'number') tsSeconds = rawTs._seconds;
          }
          if (!tsSeconds) tsSeconds = Math.floor(Date.now() / 1000);

          // Preferred comparison video
          let chosenVideo = null;
          if (hit.actionType === 'Compare' && video1 && video2) {
            const rec = hit.recommendation || '';
            if (/video 1/i.test(rec)) chosenVideo = video1;
            else if (/video 2/i.test(rec)) chosenVideo = video2;
            if (!chosenVideo) {
              const score1 = (video1.positive ?? 0) - (video1.negative ?? 0);
              const score2 = (video2.positive ?? 0) - (video2.negative ?? 0);
              chosenVideo = score2 > score1 ? video2 : video1;
            }
          }

          const preferredThumb = chosenVideo?.thumbnail;

          return {
            id: hit.id || hit._id || crypto.randomUUID?.() || Math.random().toString(),
            actionType: hit.actionType,
            timestamp: { seconds: tsSeconds },
            userInfo: hit.userInfo,
            summary: hit.summary || hit.summaryText,
            analysis: hit.analysis,
            spam_results: hit.spam_results,
            examples: hit.examples,
            recommendation: hit.recommendation,
            video1,
            video2,
            recommended,
            videoTitle:
              hit.actionType === 'Compare'
                ? chosenVideo?.title || video1?.title || video2?.title || 'Unknown Video'
                : hit.videoTitle || hit.videoUrl || hit.actionType,
            thumbnail: preferredThumb || hit.thumbnail || video1?.thumbnail || video2?.thumbnail || recommended[0]?.thumbnail || defaultThumbnail,
          };
        });

        setHits(mappedHits.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds));
      } catch (err) {
        console.error('Error fetching hits:', err);
      }

      setLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [mounted, router]);

  const totalHits = hits.length;
  const analysisHits = useMemo(() => hits.filter((h) => h.actionType === 'Analysis'), [hits]);
  const comparisonHits = useMemo(() => hits.filter((h) => h.actionType === 'Compare'), [hits]);
  const summarizeHits = useMemo(() => hits.filter((h) => h.actionType === 'Summarize'), [hits]);
  const spamHits = useMemo(() => hits.filter((h) => h.actionType === 'SpamDetection'), [hits]);
  const recommendHits = useMemo(() => hits.filter((h) => h.actionType === 'Recommend'), [hits]);
  const othersHits = useMemo(
    () => hits.filter((h) => !['Analysis', 'Compare', 'Summarize', 'SpamDetection', 'Recommend'].includes(h.actionType)),
    [hits]
  );
  const analysisCount = analysisHits.length;
  const comparisonCount = comparisonHits.length;
  const summarizeCount = summarizeHits.length;
  const spamCount = spamHits.length;
  const recommendCount = recommendHits.length;
  const othersCount = othersHits.length;

  const lastActivity = useMemo(() => {
    const considered = hits.filter((h) => ['Analysis', 'Compare', 'Summarize', 'SpamDetection', 'Recommend'].includes(h.actionType));
    if (!considered.length) return null;
    const latest = [...considered].sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)[0];
    const labelMap = { Analysis: 'Analysis', Compare: 'Comparison', Summarize: 'Summarize', SpamDetection: 'Spam Detection', Recommend: 'Recommendation' };
    return {
      label: labelMap[latest.actionType] || latest.actionType,
      time: new Date(latest.timestamp.seconds * 1000).toLocaleString(),
    };
  }, [hits]);

  const filteredHits = useMemo(() => {
    switch (filterType) {
      case 'ALL':
        return hits;
      case 'ANALYSIS':
        return analysisHits;
      case 'COMPARISON':
        return comparisonHits;
      case 'SUMMARIZE':
        return summarizeHits;
      case 'SPAM':
        return spamHits;
      case 'RECOMMEND':
        return recommendHits;
      case 'OTHERS':
        return othersHits;
      default:
        return hits;
    }
  }, [hits, analysisHits, comparisonHits, summarizeHits, spamHits, recommendHits, othersHits, filterType]);

  const groupedAll = useMemo(() => {
    if (filterType !== 'ALL') return null;
    return [
      { key: 'ANALYSIS', label: 'Analysis', items: analysisHits, count: analysisCount },
      { key: 'COMPARISON', label: 'Comparison', items: comparisonHits, count: comparisonCount },
      { key: 'SUMMARIZE', label: 'Summarize', items: summarizeHits, count: summarizeCount },
      { key: 'SPAM', label: 'Spam', items: spamHits, count: spamCount },
      { key: 'RECOMMEND', label: 'Recommend', items: recommendHits, count: recommendCount },
      { key: 'OTHERS', label: 'Others', items: othersHits, count: othersCount },
    ].filter((section) => section.items.length);
  }, [filterType, analysisHits, comparisonHits, summarizeHits, spamHits, recommendHits, othersHits, analysisCount, comparisonCount, summarizeCount, spamCount, recommendCount, othersCount]);

  return (
    <>
      <FloatingGlassMorphNavbar />
      <div className={`min-h-screen p-6 bg-gray-900 text-white ${(!mounted || !authChecked || loading) ? 'overflow-hidden' : ''}`}>
        {(!mounted || !authChecked || loading) && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader />
          </div>
        )}
        {mounted && authChecked && !loading && (
          <>
            <div className="mt-20 mb-8 relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-indigo-700/40 via-purple-700/30 to-fuchsia-700/30 backdrop-blur-xl p-6 shadow-xl">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  {userInfo.photoURL ? (
                    <img src={userInfo.photoURL} alt={userInfo.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg ring-2 ring-white/20" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-white/20">
                      {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-wide flex items-center gap-2">{userInfo.name || 'User'}</h2>
                    <p className="text-sm text-white/70 font-mono">{userInfo.email}</p>
                    {lastActivity && (
                      <p className="text-xs text-white/50 mt-1 flex flex-wrap items-center gap-1">
                        <span className="uppercase tracking-wider text-white/40">Last Activity:</span>
                        <span className="text-white/80 font-medium">{lastActivity.label}</span>
                        <span className="text-white/30">•</span>
                        <span className="font-mono text-white/60">{lastActivity.time}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 ml-auto">
                  <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/10 shadow-inner flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-white/50">Total</span>
                    <span className="text-lg font-semibold text-white">{totalHits}</span>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 text-center mt-4">📊 Dashboard</h1>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {[
                { key: 'ALL', label: 'All', count: totalHits },
                { key: 'ANALYSIS', label: 'Analysis', count: analysisCount },
                { key: 'COMPARISON', label: 'Comparison', count: comparisonCount },
                { key: 'SUMMARIZE', label: 'Summarize', count: summarizeCount },
                { key: 'SPAM', label: 'Spam', count: spamCount },
                { key: 'RECOMMEND', label: 'Recommend', count: recommendCount },
                { key: 'OTHERS', label: 'Others', count: othersCount },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFilterType(btn.key)}
                  className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition border flex items-center gap-2 ${
                    filterType === btn.key
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white border-white/30 shadow-lg'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10'
                  }`}
                >
                  {btn.label}
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 border border-white/20 text-white/60">{btn.count}</span>
                </button>
              ))}
            </div>

            {!hits.length ? (
              <div className="flex flex-col justify-center items-center mt-10">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg text-center">
                  <h2 className="text-2xl font-bold mb-2">📭 No hits yet!</h2>
                  <p className="text-gray-300">You haven't made any requests yet. Start analyzing videos now!</p>
                </div>
              </div>
            ) : filterType === 'ALL' ? (
              <div className="space-y-12">
                {groupedAll?.map((section) => (
                  <div key={section.key}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold tracking-wide">{section.label}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/60">{section.count}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div className="flex flex-col gap-6">{section.items.map(renderHitCard)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">{filteredHits.map(renderHitCard)}</div>
            )}
          </>
        )}
      </div>
    </>
  );

  function renderHitCard(hit) {
    return (
      <motion.div
        key={hit.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white/10 border border-white/20 rounded-2xl p-4 cursor-pointer shadow-lg"
        onClick={() => setExpandedHit(expandedHit?.id === hit.id ? null : hit)}
      >
        <div className="flex items-center gap-4">
          {hit.thumbnail && (
            <img src={hit.thumbnail} alt={hit.videoTitle ?? hit.actionType} className="w-20 h-20 object-cover rounded-lg" />
          )}
          <div className="flex-1">
            <p className="font-semibold">
              {hit.videoTitle !== 'Unknown title' ? hit.videoTitle : hit.recommended?.[0]?.title || hit.actionType}
            </p>
            <p className="text-sm text-gray-300">{hit.actionType === 'SpamDetection' ? 'Spam' : hit.actionType}</p>
          </div>
        </div>
        <AnimatePresence>
          {expandedHit?.id === hit.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white/5 rounded-xl"
            >
              {renderHitDetails(hit)}
              <div className="text-gray-400 text-xs mt-2">
                {new Date(hit.timestamp.seconds * 1000).toLocaleString()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  function renderHitDetails(hit) {
    const defaultThumbnail = '/default-thumbnail.png';
    switch (hit.actionType) {
      case 'Analysis':
        if (!hit.analysis) return null;
        return (
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <span className="font-bold text-green-400 text-lg">{hit.analysis.positive ?? 0}%</span>
              <p className="text-gray-300">Positive</p>
            </div>
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <span className="font-bold text-yellow-400 text-lg">{hit.analysis.neutral ?? 0}%</span>
              <p className="text-gray-300">Neutral</p>
            </div>
            <div className="p-2 bg-red-500/20 rounded-xl">
              <span className="font-bold text-red-400 text-lg">{hit.analysis.negative ?? 0}%</span>
              <p className="text-gray-300">Negative</p>
            </div>
          </div>
        );
      case 'Compare':
        return (
          <div className="space-y-4">
            {['video1', 'video2'].map((v) => {
              const video = hit[v];
              if (!video) return null;
              return (
                <div key={v} className="flex items-center gap-4 p-2 bg-white/5 rounded-xl">
                  <img
                    src={video.thumbnail || defaultThumbnail}
                    alt={video.title || 'Unknown Video'}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{video.title || 'Unknown Video'}</p>
                    <div className="grid grid-cols-3 gap-2 text-center mt-1">
                      <span>👍 {video.positive ?? 0}%</span>
                      <span>😐 {video.neutral ?? 0}%</span>
                      <span>👎 {video.negative ?? 0}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'Summarize':
        return <div className="text-gray-300 text-sm">{typeof hit.summary === 'string' ? hit.summary : hit.summary?.summary || 'No summary available.'}</div>;
      case 'SpamDetection':
        return (
          <div className="text-gray-300 text-sm">
            <p>Spam Comments: {hit.spam_results?.spam ?? 0}</p>
            <p>Not Spam: {(hit.spam_results?.total ?? 0) - (hit.spam_results?.spam ?? 0)}</p>
            {hit.examples?.length > 0 && (
              <ul className="list-disc ml-5 mt-2">
                {hit.examples.map((ex, idx) => (
                  <li key={idx}>{ex}</li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'Recommend':
        return (
          <div className="space-y-4">
            {hit.recommended?.map((video, idx) => (
              <div key={idx} className="flex items-center gap-4 p-2 bg-white/5 rounded-xl">
                <img
                  src={video.thumbnail || defaultThumbnail}
                  alt={video.title || 'Unknown Video'}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <p className="font-semibold text-white">{video.title || 'Unknown Video'}</p>
              </div>
            ))}
          </div>
        );
      default:
        return <p className="text-gray-300 text-sm">No additional data available.</p>;
    }
  }
}
