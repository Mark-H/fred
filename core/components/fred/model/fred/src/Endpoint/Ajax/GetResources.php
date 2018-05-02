<?php

namespace Fred\Endpoint\Ajax;

use Fred\Utils;

class GetResources extends Endpoint
{
    protected $allowedMethod = ['OPTIONS', 'GET'];
    protected $templates = [];
    protected $map = [];
    protected $resources = [];

    /**
     * @return string
     */
    function process()
    {
        $context = 'web';
        
        $query = $_GET['query'];
        $current = isset($_GET['current']) ? intval($_GET['current']) : 0;
        $parents = isset($_GET['parents']) ? $_GET['parents'] : '';
        $resources = isset($_GET['resources']) ? $_GET['resources'] : '';
        $depth = isset($_GET['depth']) ? intval($_GET['depth']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 25;
        
        $parents = Utils::explodeAndClean($parents, ',', 'intval');
        $resources = Utils::explodeAndClean($resources, ',', 'intval');
        
        $currentResource = null;
        
        if (!empty($current)) {
            $currentResource = $this->modx->getObject('modResource', $current);
            if ($currentResource) {
                $currentResource = [
                    'id' => $currentResource->id,
                    'value' => (string)$currentResource->id,
                    'pagetitle' => $currentResource->pagetitle,
                    'customProperties' => [
                        'url' => $this->modx->makeUrl($currentResource->id, $context, '', 'abs')
                    ]
                ];
            } else {
                $currentResource = null;
            }
        }
        
        $c = $this->modx->newQuery('modResource');
        $where = [
            'context_key' => $context
        ];
        
        if (!empty($current)) {
            $where['id:!='] = $current;
        }
        
        if (!empty($parents) || !empty($resources)) {
            $resourceIDs = [];
            
            if (!empty($resources)) {
                $resourceIDs = $resources;
            } else {
                foreach ($parents as $parent) {
                    $resourceIDs[] = $parent;
                    
                    $childIDs = $this->modx->getChildIds($parent, $depth, ['context' => $context]);
                    if (!empty($childIDs)) {
                        $resourceIDs = array_merge($resourceIDs, $childIDs);
                    }
                }

                $resourceIDs = array_keys(array_flip($resourceIDs));
            }

            $where['id:IN'] = $resourceIDs;
        }
        
        $c->limit($limit);
        
        if (!empty($query)) {
            $where['pagetitle:LIKE'] = '%' . $query . '%';
        }
        
        $c->where($where);

        $data = [];
        $resourcesIterator = $this->modx->getCollection('modResource', $c);
        
        foreach ($resourcesIterator as $resource) {
            $data[] = [
                'id' => $resource->id,
                'value' => (string)$resource->id,
                'pagetitle' => $resource->pagetitle,
                'customProperties' => [
                    'url' => $this->modx->makeUrl($resource->id, $context, '', 'abs')
                ]
            ];
        }

        return $this->data(['resources' => $data, 'current' => $currentResource]);
    }
}
