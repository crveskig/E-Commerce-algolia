import algoliasearch from 'algoliasearch/lite';
import React, { useEffect, useRef, useState } from 'react';
import {
  Configure,
  HierarchicalMenu,
  Hits,
  HitsPerPage,
  InstantSearch,
  Pagination,
  RefinementList,
  SearchBox,
  SortBy,
  ToggleRefinement,
  Highlight,
  Snippet,
} from 'react-instantsearch';

import {
  AlgoliaSvg,
  ClearFilters,
  ClearFiltersMobile,
  NoResults,
  NoResultsBoundary,
  Panel,
  PriceSlider,
  Ratings,
  ResultsNumberMobile,
  SaveFiltersMobile,
} from './components';
import { ScrollTo } from './components/ScrollTo';
import getRouting from './routing';
import { formatNumber } from './utils';
import './Theme.css';
import './App.css';
import './components/Pagination.css';
import './App.mobile.css';
import { INDEXNAME, SEARCH_URL, API_KEY } from './config';
import type { Hit as AlgoliaHit } from 'instantsearch.js';

const searchClient = algoliasearch(
  SEARCH_URL,
  API_KEY
);

const indexName = INDEXNAME;
const index = searchClient.initIndex(indexName);
const routing = getRouting(indexName);

export function App() {
  const containerRef = useRef<HTMLElement>(null);
  const headerRef = useRef(null);

  const [motoNamesList, setMotoNamesBySKU] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { hits } = await index.search('', {
          hitsPerPage: 1000, // Adjust the number as needed
          attributesToRetrieve: ['sku', 'moto_name'], // Add all attributes you want to retrieve
          distinct: false // Ensure distinct is disabled
        });
        const motoNamesBySkuObj = {};
        hits.map((hit) => {
          const sku = hit.sku;
          if(hit.moto_name != ""){
            const motoNames = hit.moto_name.map(name => name.trim());

            if (!motoNamesBySkuObj[sku]) {
              motoNamesBySkuObj[sku] = new Set();
            }
  
            motoNames.forEach(name => {
              motoNamesBySkuObj[sku].add(name);
            });
          }
        });
        Object.keys(motoNamesBySkuObj).forEach(sku => {
          motoNamesBySkuObj[sku] = Array.from(motoNamesBySkuObj[sku]);
        });
        setMotoNamesBySKU(motoNamesBySkuObj);
      } catch (error) {
        console.error('Error fetching products from Algolia', error);
      }
    };

    fetchProducts();
  }, []);

  function openFilters() {
    document.body.classList.add('filtering');
    window.scrollTo(0, 0);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('click', onClick);
  }

  function closeFilters() {
    document.body.classList.remove('filtering');
    containerRef.current!.scrollIntoView();
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('click', onClick);
  }

  function onKeyUp(event: { key: string }) {
    if (event.key !== 'Escape') {
      return;
    }

    closeFilters();
  }

  function onClick(event: MouseEvent) {
    if (event.target !== headerRef.current) {
      return;
    }

    closeFilters();
  }

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indexName}
      routing={routing}
      insights={true}
    >
      <header className="header" ref={headerRef}>
        <p className="header-logo">
          <AlgoliaSvg />
        </p>

        <p className="header-title">Stop looking for an item — find it.</p>

        <SearchBox
          placeholder="Product, brand, …"
          submitIconComponent={SubmitIcon}
        />
      </header>

      <Configure
        attributesToSnippet={['description:10']}
        snippetEllipsisText="…"
        removeWordsIfNoResults="allOptional"
      />

      <ScrollTo>
        <main className="container" ref={containerRef}>
          <div className="container-wrapper">
            <section className="container-filters" onKeyUp={onKeyUp}>
              <div className="container-header">
                <h2>Filters</h2>

                <div className="clear-filters" data-layout="desktop">
                  <ClearFilters />
                </div>

                <div className="clear-filters" data-layout="mobile">
                  <ResultsNumberMobile />
                </div>
              </div>

              <div className="container-body">

                <Panel header="Motorbike">
                  <RefinementList
                    attribute="moto_name"
                    searchable={true}
                    searchablePlaceholder="Search for vehicle…"
                    showMore={true}
                    showMoreLimit={1000}
                    limit={8}
                  />
                </Panel>

                <Panel header="Category">
                  <HierarchicalMenu
                    attributes={[
                      'categories.lvl0',
                      'categories.lvl1',
                      'categories.lvl2',
                      'categories.lvl3',
                    ]}
                    limit={5}
                    showMore={true}
                    showMoreLimit={20}
                    showParentLevel={true}
                    sortBy={['name:asc', 'count']}
                  />
                </Panel>

                <Panel header="Brands">
                  <RefinementList
                    attribute="brand"
                    searchable={true}
                    searchablePlaceholder="Search for brands…"
                    showMore={true}
                    showMoreLimit={20}
                    limit={5}
                  />
                </Panel>

                <Panel header="Price">
                  <PriceSlider attribute="price" />
                </Panel>
              </div>
            </section>

            <footer className="container-filters-footer" data-layout="mobile">
              <div className="container-filters-footer-button-wrapper">
                <ClearFiltersMobile containerRef={containerRef} />
              </div>

              <div className="container-filters-footer-button-wrapper">
                <SaveFiltersMobile onClick={closeFilters} />
              </div>
            </footer>
          </div>

          <section className="container-results">
            <header className="container-header container-options">
              <SortBy
                className="container-option"
                items={[
                  {
                    label: 'Sort by featured',
                    value: 'instant_search',
                  },
                  {
                    label: 'Price ascending',
                    value: 'instant_search_price_asc',
                  },
                  {
                    label: 'Price descending',
                    value: 'instant_search_price_desc',
                  },
                ]}
              />

              <HitsPerPage
                className="container-option"
                items={[
                  {
                    label: '16 hits per page',
                    value: 16,
                    default: true,
                  },
                  {
                    label: '32 hits per page',
                    value: 32,
                  },
                  {
                    label: '64 hits per page',
                    value: 64,
                  },
                ]}
              />
            </header>

            <NoResultsBoundary fallback={<NoResults />}>
            <Hits hitComponent={(props) => <Hit {...props} motoNamesList={motoNamesList} />} />
            </NoResultsBoundary>

            <footer className="container-footer">
              <Pagination padding={2} showFirst={false} showLast={false} />
            </footer>
          </section>
        </main>
      </ScrollTo>

      <aside data-layout="mobile">
        <button
          className="filters-button"
          data-action="open-overlay"
          onClick={openFilters}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 14">
            <path
              d="M15 1H1l5.6 6.3v4.37L9.4 13V7.3z"
              stroke="#fff"
              strokeWidth="1.29"
              fill="none"
              fillRule="evenodd"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Filters
        </button>
      </aside>
    </InstantSearch>
  );
}

function getCategoryBreadcrumb(hit) {
  const highlightValues = hit._highlightResult.categories || [];
  return highlightValues.map(category => category.value).join(' > ');
}

function aggregateMotoNames(hit) {

}

function SubmitIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <g
        fill="none"
        fillRule="evenodd"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.67"
        transform="translate(1 1)"
      >
        <circle cx="7.11" cy="7.11" r="7.11" />
        <path d="M16 16l-3.87-3.87" />
      </g>
    </svg>
  );
}

type HitType = AlgoliaHit<{
  image: string;
  name: string;
  categories: string[];
  description: string;
  price: number;
  rating: string;
}>;

function Hit({ hit, motoNamesList }: { hit: HitType, motoNamesList: { [key: string]: string[] } }) {
  const motoNames = motoNamesList[hit.sku] || [];
  
  const [motoListVisible, setMotoListVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMotoList = () => {
      setMotoListVisible(!motoListVisible);
  };

  const filterMotoList = (query) => {
      setSearchQuery(query);
  };

  const fitButton = motoNames.length > 0 && (
      <button onClick={toggleMotoList} className="os-result_product-fit">Suitable for...</button>
  );


  const filteredMotoNames = motoNames.filter(motoName => motoName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <article>
      <div className="os-result_img">
        <img src={hit.image} alt={hit.name} className="hit-image" />
      </div> 
      <div className="os-result_product-info">
          <div className="os-result_product-meta">
              <p className="os-result_pi-brand">
                <Highlight attribute="brand" highlightedTagName="brand" hit={hit} />
              </p>
              <p className="os-result_pi-sku">
                <Highlight attribute="sku" highlightedTagName="sku" hit={hit} />
              </p>
          </div>    
          <a className="os-result_pi-title-link" href={hit.url} target="_blank">                       
            <h3 className="os-result_pi-title">
              <Highlight attribute="title" highlightedTagName="title" hit={hit} />
            </h3>
          </a>
          <div>
          <p className="hit-category-breadcrumb">{getCategoryBreadcrumb(hit)}</p>
          <p className="os-result_price">Catalog price: <span>{hit.cena || '--'} CENA</span></p>
          <p className={`os-result_ava ${hit.status === 'Dostępny' ? 'os-stock' : hit.status === 'Chwilowo niedostępny' ? 'os-out-stock' : 'os-result_ava'}`}>
            Availability: <span>{hit.status}</span>
          </p>
          {hit.status === 'Dostępny' ? (
            <a
              href={hit.url}
              className={hit.url ? 'os-result_product-add' : 'missing-attribute'}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to cart
            </a>
          ) : (
            <a
              href={hit.url}
              className={hit.url ? 'os-result_product-add os-btn-disable' : 'missing-attribute os-btn-disable'}
              target="_blank"
              rel="noopener noreferrer"
            >
              View product
            </a>
          )}
          {fitButton}
          {motoListVisible && (
              <div id={`motoList-${hit.objectID}`} className="moto-names-list">
                  <input type="search" onChange={(e) => filterMotoList(e.target.value)} placeholder="Search for a vehicle..." />
                  <ul>
                      {filteredMotoNames.map(motoName => <li key={motoName}>{motoName.trim()}</li>)}
                  </ul>
              </div>
          )}
        </div>
      </div>
      </article>
  );
}
